import React, { useState, useCallback, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [graphStartDate, setGraphStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [graphEndDate, setGraphEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tableStartDate, setTableStartDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Default to today
  const [tableEndDate, setTableEndDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Default to today
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('isAdmin');
    navigate('/');
  }, [navigate]);

  const fetchGraphStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, logging out');
        handleLogout();
        return;
      }
      const response = await axios.get('http://localhost:8080/api/login-stats', {
        params: { startDate: graphStartDate, endDate: graphEndDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched graph stats:', {
        start: graphStartDate,
        end: graphEndDate,
        data: response.data,
      });
      const completeStats = processStats(response.data, graphStartDate, graphEndDate);
      setStats(completeStats);
    } catch (error) {
      console.error('Error fetching graph stats:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  }, [graphStartDate, graphEndDate, handleLogout]);

  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, logging out');
        handleLogout();
        return;
      }
      const startUTC = format(parseISO(tableStartDate), 'yyyy-MM-dd');
      const endUTC = format(parseISO(tableEndDate), 'yyyy-MM-dd');
      console.log('Sending user stats request:', { startUTC, endUTC });
      const response = await axios.get('http://localhost:8080/api/user-login-stats', {
        params: { startDate: startUTC, endDate: endUTC },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched user stats:', {
        start: startUTC,
        end: endUTC,
        data: response.data,
      });
      setUserStats(response.data || []);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  }, [tableStartDate, tableEndDate, handleLogout]);

  const processStats = (apiData, start, end) => {
    const startDateObj = startOfDay(parseISO(start));
    const endDateObj = startOfDay(parseISO(end));
    const allDates = eachDayOfInterval({ start: startDateObj, end: endDateObj });

    const statsMap = new Map();
    apiData.forEach(stat => {
      const statDate = startOfDay(parseISO(stat.date));
      const dateKey = format(statDate, 'yyyy-MM-dd');
      statsMap.set(dateKey, { date: dateKey, count: stat.count });
    });

    console.log('Processed stats map:', Array.from(statsMap.entries()));
    return allDates.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return statsMap.get(dateKey) || { date: dateKey, count: 0 };
    });
  };

  const handleFetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchGraphStats(), fetchUserStats()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchGraphStats, fetchUserStats]);

  const clearTableFilter = () => {
    console.log('Clearing table filter to today');
    const today = format(new Date(), 'yyyy-MM-dd');
    setTableStartDate(today);
    setTableEndDate(today);
    handleFetchData(); // Trigger fetch for today's data
  };

  // Auto-fetch when table dates change
  useEffect(() => {
    console.log('Table date changed, fetching data:', { tableStartDate, tableEndDate });
    handleFetchData();
  }, [tableStartDate, tableEndDate, handleFetchData]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('Initial fetch triggered');
    handleFetchData();
  }, [handleFetchData]);

  const prepareChartData = () => {
    const labels = stats.map(stat => format(parseISO(stat.date), 'MMM dd'));
    const data = stats.map(stat => stat.count);

    return {
      labels,
      datasets: [
        {
          label: 'Daily Logins',
          data,
          backgroundColor: chartType === 'bar' ? 'rgba(75, 192, 192, 0.7)' : 'rgba(75, 192, 192, 0.3)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.1,
          fill: chartType === 'line',
          borderRadius: chartType === 'bar' ? 6 : 0,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 14, weight: 'bold' } },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        padding: 12,
        callbacks: {
          label: context => `${context.dataset.label}: ${context.raw}`,
          title: context => format(parseISO(stats[context[0].dataIndex].date), 'MMM dd, yyyy'),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
      },
    },
    animation: { duration: 1000 },
  };

  return (
    <div className="admindashboard">
      <div className="admindashboard-header">
        <div className="admindashboard-header-content">
          <h1>Admin Dashboard</h1>
          <button onClick={handleLogout} className="admindashboard-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="admindashboard-content">
        <div className="admindashboard-stats-card">
          <div className="admindashboard-card-header">
            <h2>User Login Statistics</h2>
            <div className="admindashboard-chart-toggle">
              <button
                onClick={() => setChartType('bar')}
                className={chartType === 'bar' ? 'active' : ''}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType('line')}
                className={chartType === 'line' ? 'active' : ''}
              >
                Line Graph
              </button>
            </div>
          </div>

          <div className="admindashboard-date-controls">
            <div className="admindashboard-date-input">
              <label>Graph Start Date</label>
              <input
                type="date"
                value={graphStartDate}
                onChange={e => setGraphStartDate(e.target.value)}
                max={graphEndDate}
              />
            </div>
            <div className="admindashboard-date-input">
              <label>Graph End Date</label>
              <input
                type="date"
                value={graphEndDate}
                onChange={e => setGraphEndDate(e.target.value)}
                min={graphStartDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          <div className="admindashboard-chart-container">
            {stats.length > 0 ? (
              chartType === 'bar' ? (
                <Bar data={chartData} options={options} />
              ) : (
                <Line data={chartData} options={options} />
              )
            ) : (
              <div className="admindashboard-no-data">
                {isLoading ? 'Loading graph data...' : 'No graph data available.'}
              </div>
            )}
          </div>

          <div className="admindashboard-user-stats">
            <h3>User Login Details</h3>
            <div className="admindashboard-date-controls">
              <div className="admindashboard-date-range">
                <div className="admindashboard-date-input">
                  <label>Table Start Date</label>
                  <input
                    type="date"
                    value={tableStartDate}
                    onChange={e => setTableStartDate(e.target.value)}
                    max={tableEndDate}
                  />
                </div>
                <div className="admindashboard-date-input">
                  <label>Table End Date</label>
                  <input
                    type="date"
                    value={tableEndDate}
                    onChange={e => setTableEndDate(e.target.value)}
                    min={tableStartDate}
                  />
                </div>
              </div>
              <button
                onClick={handleFetchData}
                disabled={isLoading}
                className="admindashboard-refresh-btn"
              >
                {isLoading ? 'Fetching...' : 'Fetch Data'}
              </button>
              <button
                onClick={clearTableFilter}
                disabled={isLoading}
                className="admindashboard-refresh-btn"
              >
                Show Today's Logins
              </button>
            </div>
            {userStats.length > 0 ? (
              <div className="table-container">
                <table className="admindashboard-user-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Login Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr key={`${stat.email}-${index}`}>
                        <td>{stat.email}</td>
                        <td>{stat.count}</td>
</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admindashboard-no-data">
                {isLoading ? 'Loading user data...' : 'No user login data available.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;