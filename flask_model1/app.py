from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import re
from concurrent.futures import ThreadPoolExecutor
import time
from transformers import pipeline, AutoTokenizer, T5ForConditionalGeneration
import requests
from datetime import datetime, timedelta
from werkzeug.exceptions import HTTPException
from functools import lru_cache, wraps

# Initialize Flask app
app = Flask(__name__)

# Enable CORS with environment variable
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000')
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model configuration for summarization
MODEL_NAME = "Ruthwik/LExiMinD_legal_t5_summarizer"
CHUNK_SIZE = 512
DEFAULT_MAX_LENGTH = 300
DEFAULT_MIN_LENGTH = 100

# Configuration for file handling
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
PREPROCESSED_FOLDER = os.path.join(BASE_DIR, 'preprocessed')
PROCESSED_FOLDER = os.path.join(BASE_DIR, 'processed')

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PREPROCESSED_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PREPROCESSED_FOLDER'] = PREPROCESSED_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB file size limit

# Translation configuration
app.config.from_mapping(
    MYMEMORY_URL='https://api.mymemory.translated.net/get',
    LIBRE_URL='https://libretranslate.de/translate',
    RATE_LIMIT=10,  # requests per minute
    CACHE_SIZE=1000,
    REQUEST_TIMEOUT=15
)

# Rate limiting storage
request_timestamps = {}

# Lazy-load the summarization model
summarizer = None
tokenizer = None
model = None

def load_model():
    global summarizer, tokenizer, model
    if summarizer is None:
        logger.info("⏳ Loading summarization model...")
        device = -1  # Always use CPU
        logger.info("Using device: CPU")
        try:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)
            summarizer = pipeline(
                "summarization",
                model=model,
                tokenizer=tokenizer,
                device=device
            )
            logger.info("✅ Model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            raise

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log_memory_usage():
    logger.info("Memory usage logging disabled for CPU-only mode")

def chunk_text(text, chunk_size=CHUNK_SIZE):
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0

    for word in words:
        if current_length + len(word) < chunk_size:
            current_chunk.append(word)
            current_length += len(word)
        else:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_length = len(word)

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks

def summarize_chunk(chunk, max_length=DEFAULT_MAX_LENGTH, min_length=DEFAULT_MIN_LENGTH):
    try:
        return summarizer(
            chunk,
            max_length=max_length,
            min_length=min_length,
            length_penalty=1.5,
            num_beams=4,
            no_repeat_ngram_size=3,
            early_stopping=True
        )[0]['summary_text']
    except Exception as e:
        logger.error(f"Error summarizing chunk: {str(e)}")
        return ""

def parallel_summarize(text, max_length=None, min_length=None):
    if not text.strip():
        return ""
        
    word_count = len(text.split())
    if max_length is None:
        max_length = min(DEFAULT_MAX_LENGTH + (word_count // 100), 512)
    if min_length is None:
        min_length = min(DEFAULT_MIN_LENGTH + (word_count // 200), 256)
    
    chunks = chunk_text(text)
    
    with ThreadPoolExecutor(max_workers=1) as executor:
        summaries = list(executor.map(
            lambda c: summarize_chunk(c, max_length, min_length),
            chunks
        ))
    
    final_summary = " ".join([s for s in summaries if s])
    final_summary = re.sub(r'\s+([.,;:])', r'\1', final_summary)
    final_summary = re.sub(r'\.\s+\.', '.', final_summary)
    final_summary = re.sub(r'\s+', ' ', final_summary).strip()
    
    return final_summary

def preprocess_text(text):
    try:
        if not text or not isinstance(text, str):
            return ""
            
        text = re.sub(r'Page\s*\d+\s*of\s*\d+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\n\d+\n', '\n', text)
        
        noise_patterns = [
            r'This\s+document\s+was\s+signed\s+electronically.*',
            r'Electronic\s+signature.*',
            r'IN\s+THE\s+(?:SUPREME\s+)?COURT\s+OF\s+.*\n',
            r'CASE\s+NO[.:].*\n',
            r'BEFORE[.:].*\n',
            r'JUDGMENT\s+RESERVED\s+ON[.:].*\n',
            r'PRESENT[.:].*\n'
        ]
        
        for pattern in noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if (re.fullmatch(r'\d+', line) or 
                len(line) < 25 or 
                line.startswith(('§', '©', 'Page', 'http'))):
                continue
                
            cleaned_lines.append(line)
        
        return '\n\n'.join(cleaned_lines) or ""
    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        return text if isinstance(text, str) else ""

def get_processed_filename(original_filename):
    base = os.path.splitext(os.path.basename(original_filename))[0]
    return f"processed_{secure_filename(base)}.txt"

def get_processed_path(filename):
    processed_filename = get_processed_filename(filename)
    return os.path.normpath(os.path.join(app.config['PROCESSED_FOLDER'], processed_filename))

def extract_text_from_file(filepath, filename):
    try:
        ext = os.path.splitext(filename)[1].lower()
        
        if ext == '.pdf':
            text = ""
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
            return text.strip()
        
        elif ext in ['.doc', '.docx']:
            doc = docx.Document(filepath)
            return "\n".join(para.text for para in doc.paragraphs if para.text)
        
        elif ext == '.txt':
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                return f.read()
        
        raise ValueError(f"Unsupported file type: {ext}")
    
    except Exception as e:
        logger.error(f"Extraction failed for {filename}: {str(e)}")
        raise

def rate_limited(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        now = datetime.now()
        
        # Clean up old timestamps
        request_timestamps[ip] = [
            ts for ts in request_timestamps.get(ip, []) 
            if now - ts < timedelta(minutes=1)
        ]
        
        # Check rate limit
        if len(request_timestamps.get(ip, [])) >= app.config['RATE_LIMIT']:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': f'Limit is {app.config["RATE_LIMIT"]} requests per minute.'
            }), 429
        
        # Add new timestamp
        request_timestamps.setdefault(ip, []).append(now)
        
        return f(*args, **kwargs)
    return decorated_function

@lru_cache(maxsize=app.config['CACHE_SIZE'])
def translate_text(text, target_lang):
    import time

    # Retry configuration
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Translating to {target_lang} using MyMemory: {text[:50]}...")
            response = requests.get(
                app.config['MYMEMORY_URL'],
                params={'q': text, 'langpair': f'en|{target_lang}'},
                timeout=app.config['REQUEST_TIMEOUT']
            )
            logger.info(f"MyMemory response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"MyMemory response data: {data}")
                if 'responseData' in data and 'translatedText' in data['responseData']:
                    translated = data['responseData']['translatedText']
                    logger.info(f"MyMemory translated text: {translated[:50]}...")
                    return translated
            elif response.status_code == 429:
                logger.warning(f"MyMemory rate limit hit, retrying {attempt + 1}/{max_retries}")
                time.sleep(2 ** attempt)
                continue
        except requests.exceptions.RequestException as e:
            logger.warning(f"MyMemory translation failed: {str(e)}, retrying {attempt + 1}/{max_retries}")
            time.sleep(2 ** attempt)
    
    # Fallback to LibreTranslate
    for attempt in range(max_retries):
        try:
            logger.info(f"Translating to {target_lang} using LibreTranslate: {text[:50]}...")
            response = requests.post(
                app.config['LIBRE_URL'],
                json={'q': text, 'source': 'en', 'target': target_lang},
                timeout=app.config['REQUEST_TIMEOUT']
            )
            logger.info(f"LibreTranslate response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"LibreTranslate response data: {data}")
                if 'translatedText' in data:
                    translated = data['translatedText']
                    logger.info(f"LibreTranslate translated text: {translated[:50]}...")
                    return translated
            elif response.status_code == 429:
                logger.warning(f"LibreTranslate rate limit hit, retrying {attempt + 1}/{max_retries}")
                time.sleep(2 ** attempt)
                continue
        except requests.exceptions.RequestException as e:
            logger.warning(f"LibreTranslate translation failed: {str(e)}, retrying {attempt + 1}/{max_retries}")
            time.sleep(2 ** attempt)
    
    raise Exception('Translation failed - all services exhausted after retries')

@app.route('/health', methods=['GET'])
def health_check():
    log_memory_usage()
    return jsonify({
        "status": "healthy",
        "model_loaded": summarizer is not None,
        "device": "cpu",
        "chunk_size": CHUNK_SIZE,
        "default_max_length": DEFAULT_MAX_LENGTH,
        "default_min_length": DEFAULT_MIN_LENGTH
    })

@app.route('/summarize', methods=['POST'])
def summarize():
    if summarizer is None:
        try:
            load_model()
        except Exception as e:
            return jsonify({
                "error": "Model failed to load",
                "summary": "",
                "status": "error"
            }), 503
    
    if 'file' not in request.files:
        return jsonify({
            "error": "No file uploaded",
            "summary": "",
            "status": "error"
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            "error": "No selected file",
            "summary": "",
            "status": "error"
        }), 400
    
    if not file or not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type. Allowed: pdf, doc, docx, txt",
            "summary": "",
            "status": "error"
        }), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    preprocessed_path = os.path.join(app.config['PREPROCESSED_FOLDER'], f"preprocessed_{filename}.txt")
    
    try:
        file.save(filepath)
        logger.info(f"Processing file: {filename}")
        log_memory_usage()
        
        raw_text = extract_text_from_file(filepath, filename)
        if not raw_text or not raw_text.strip():
            logger.error(f"Empty text extracted from {filename}")
            return jsonify({
                "error": "Empty file or could not extract text",
                "summary": "",
                "status": "error"
            }), 400
            
        cleaned_text = preprocess_text(raw_text)
        logger.info(f"Text length: {len(cleaned_text)} chars, {len(cleaned_text.split())} words")
        
        with open(preprocessed_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_text)
        
        start_time = time.time()
        summary = parallel_summarize(cleaned_text)
        processing_time = time.time() - start_time
        
        if not summary:
            raise ValueError("Failed to generate summary - empty result")
        
        logger.info(f"Generated summary in {processing_time:.2f} seconds")
        logger.info(f"Summary length: {len(summary.split())} words")
        
        return jsonify({
            "summary": summary,
            "filename": filename,
            "processing_time": f"{processing_time:.2f} seconds",
            "word_count": len(cleaned_text.split()),
            "summary_length": len(summary.split()),
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)}")
        return jsonify({
            "error": "Processing failed",
            "details": str(e),
            "filename": filename,
            "summary": "",
            "status": "error"
        }), 500
    finally:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                logger.error(f"Error removing file {filepath}: {str(e)}")
        log_memory_usage()

@app.route('/translate', methods=['POST'])
@rate_limited
def translate_endpoint():
    MAX_LENGTH = 500
    
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400
    
    data = request.get_json()
    text = data.get('text')
    lang = data.get('lang')
    chunked = data.get('chunked', True)  # Enable chunking by default for robustness
    
    if not text or not lang:
        return jsonify({
            'error': 'Missing required parameters',
            'message': 'Both "text" and "lang" are required'
        }), 400
    
    if not isinstance(text, str) or not isinstance(lang, str):
        return jsonify({
            'error': 'Invalid parameters',
            'message': 'Both "text" and "lang" must be strings'
        }), 400
    
    try:
        if chunked and len(text) > MAX_LENGTH:
            logger.info(f"Chunking text for translation. Text length: {len(text)}")
            chunks = [text[i:i + MAX_LENGTH] for i in range(0, len(text), MAX_LENGTH)]
            translated_chunks = [translate_text(chunk, lang) for chunk in chunks]
            translated_text = ' '.join(translated_chunks)
        else:
            translated_text = translate_text(text, lang)
        
        return jsonify({
            'translation': translated_text,  # Changed key to match frontend expectation
            'status': 'success'
        })
    
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({
            'error': 'Translation failed',
            'message': str(e),
            'status': 'error'
        }), 500

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    
    logger.error(f"Unexpected error: {str(e)}")
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
