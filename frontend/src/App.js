import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ShoppingCart, Brain, TrendingUp, AlertCircle, CheckCircle, XCircle, Zap, Home, History, Target, Award, Download, Activity, Clock, Users, DollarSign } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'https://purchase-intent-api.onrender.com';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('xgboost');
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [realtimeStats, setRealtimeStats] = useState({
    todayPredictions: 0,
    todayConversions: 0,
    avgResponseTime: 0,
    liveUsers: 1
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    highIntent: 0,
    conversionRate: 0
  });

  // MONITORING STATE - ADDED HERE
  const [metrics, setMetrics] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringError, setMonitoringError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [formData, setFormData] = useState({
    Administrative: 0,
    Informational: 0,
    ProductRelated: 10,
    BounceRates: 0.05,
    PageValues: 15.0,
    SpecialDay: 0.0,
    Month: 'Nov',
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 2,
    VisitorType: 'Returning_Visitor',
    Weekend: false
  });

  // Animated counter effect
  useEffect(() => {
    const stats = {
      total: predictionHistory.length || 156,
      highIntent: predictionHistory.filter(p => p.probability > 0.7).length || 54,
      conversionRate: predictionHistory.length ? ((predictionHistory.filter(p => p.prediction === 1).length / predictionHistory.length) * 100) : 68.2
    };

    const duration = 1000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setAnimatedStats({
        total: Math.floor(stats.total * progress),
        highIntent: Math.floor(stats.highIntent * progress),
        conversionRate: (stats.conversionRate * progress).toFixed(1)
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(stats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [predictionHistory]);

  // Real-time updates simulation
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setRealtimeStats(prev => ({
        todayPredictions: prev.todayPredictions + Math.floor(Math.random() * 3),
        todayConversions: prev.todayConversions + Math.floor(Math.random() * 2),
        avgResponseTime: (120 + Math.random() * 50).toFixed(0),
        liveUsers: Math.max(1, prev.liveUsers + (Math.random() > 0.5 ? 1 : -1))
      }));
    }, 5000);

    return () => clearInterval(updateInterval);
  }, []);

  // Monitoring metrics fetching - ADDED HERE
  useEffect(() => {
    const fetchMetrics = async () => {
      if (currentPage !== 'monitoring') return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/metrics`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setMetrics(data);
        setMonitoringError(null);
      } catch (err) {
        setMonitoringError('Failed to load metrics. Ensure backend is running.');
      } finally {
        setMonitoringLoading(false);
      }
    };

    if (currentPage === 'monitoring') {
      fetchMetrics();

      if (autoRefresh) {
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [currentPage, autoRefresh]);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/predict?model_name=${selectedModel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      setPrediction(data);

      const newEntry = {
        ...data,
        timestamp: new Date().toLocaleString(),
        responseTime,
        formData: {...formData}
      };

      setPredictionHistory(prev => [newEntry, ...prev].slice(0, 50));

      // Add to activity feed
      setActivityFeed(prev => [{
        id: Date.now(),
        type: data.prediction === 1 ? 'purchase' : 'abandon',
        probability: data.probability,
        time: new Date().toLocaleTimeString(),
        model: selectedModel
      }, ...prev].slice(0, 10));

      // Update realtime stats
      setRealtimeStats(prev => ({
        ...prev,
        todayPredictions: prev.todayPredictions + 1,
        todayConversions: prev.todayConversions + (data.prediction === 1 ? 1 : 0),
        avgResponseTime: responseTime
      }));

    } catch (err) {
      setError('Connection failed. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const exampleScenarios = [
    { name: '🎯 High Intent', data: { ProductRelated: 25, PageValues: 45.0, BounceRates: 0.01, VisitorType: 'Returning_Visitor', Month: 'Nov' }},
    { name: '👀 Browser', data: { ProductRelated: 3, PageValues: 0, BounceRates: 0.3, VisitorType: 'New_Visitor', Month: 'Feb' }},
    { name: '⚖️ Average', data: { ProductRelated: 12, PageValues: 18.0, BounceRates: 0.05, VisitorType: 'Returning_Visitor', Month: 'May' }}
  ];

  const loadExample = (example) => {
    setFormData(prev => ({ ...prev, ...example.data }));
    setPrediction(null);
  };

  const weekData = [
    { day: 'Mon', predictions: 45, conversions: 32, revenue: 1280 },
    { day: 'Tue', predictions: 52, conversions: 38, revenue: 1520 },
    { day: 'Wed', predictions: 48, conversions: 35, revenue: 1400 },
    { day: 'Thu', predictions: 61, conversions: 44, revenue: 1760 },
    { day: 'Fri', predictions: 55, conversions: 41, revenue: 1640 },
    { day: 'Sat', predictions: 38, conversions: 25, revenue: 1000 },
    { day: 'Sun', predictions: 42, conversions: 28, revenue: 1120 }
  ];

  const hourlyData = predictionHistory.length > 0
    ? predictionHistory.slice(0, 10).reverse().map((item, idx) => ({
        time: `${idx}m ago`,
        probability: (item.probability * 100).toFixed(0)
      }))
    : [
        { time: '10m', probability: 65 },
        { time: '9m', probability: 72 },
        { time: '8m', probability: 58 },
        { time: '7m', probability: 81 },
        { time: '6m', probability: 45 },
        { time: '5m', probability: 90 },
        { time: '4m', probability: 68 },
        { time: '3m', probability: 75 },
        { time: '2m', probability: 82 },
        { time: '1m', probability: 70 }
      ];

  const intentDist = [
    { name: 'High', value: 35, color: '#10b981' },
    { name: 'Medium', value: 45, color: '#f59e0b' },
    { name: 'Low', value: 20, color: '#ef4444' }
  ];

  const modelData = [
    { model: 'XGBoost', accuracy: 86.5, recall: 77.6 },
    { model: 'Random Forest', accuracy: 88.3, recall: 58.9 },
    { model: 'Logistic', accuracy: 86.8, recall: 81.1 }
  ];

  const LiveStatCard = ({ icon: Icon, value, label, gradient, pulse }) => (
    <div className={`stat-card ${gradient} ${pulse ? 'pulse-animation' : ''}`}>
      <div className="stat-icon">
        <Icon size={40} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {pulse && <div className="live-indicator">● LIVE</div>}
    </div>
  );

  const renderDashboard = () => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Real-Time Analytics Dashboard</h2>
          <p>Live updates • Refreshing every 5 seconds</p>
        </div>
        <div className="live-badge pulse-animation">
          <Activity size={16} />
          <span>LIVE</span>
        </div>
      </div>

      <div className="stats-grid">
        <LiveStatCard
          icon={Target}
          value={animatedStats.total || realtimeStats.todayPredictions}
          label="Total Predictions Today"
          gradient="gradient-blue"
          pulse={true}
        />
        <LiveStatCard
          icon={TrendingUp}
          value={animatedStats.highIntent || realtimeStats.todayConversions}
          label="High Intent Customers"
          gradient="gradient-green"
          pulse={true}
        />
        <LiveStatCard
          icon={Award}
          value={`${animatedStats.conversionRate}%`}
          label="Conversion Rate"
          gradient="gradient-purple"
        />
        <LiveStatCard
          icon={Clock}
          value={`${realtimeStats.avgResponseTime}ms`}
          label="Avg Response Time"
          gradient="gradient-orange"
        />
      </div>

      {/* Real-time Activity Feed */}
      <div className="activity-section">
        <div className="chart-card activity-card">
          <div className="card-header">
            <h3>Live Activity Feed</h3>
            <div className="users-online">
              <Users size={16} />
              <span>{realtimeStats.liveUsers} users online</span>
            </div>
          </div>
          <div className="activity-feed">
            {activityFeed.length > 0 ? (
              activityFeed.map((activity) => (
                <div key={activity.id} className="activity-item fade-in">
                  <div className="activity-icon">
                    {activity.type === 'purchase' ? (
                      <CheckCircle size={20} className="success-icon" />
                    ) : (
                      <XCircle size={20} className="danger-icon" />
                    )}
                  </div>
                  <div className="activity-details">
                    <div className="activity-text">
                      <strong>{activity.type === 'purchase' ? 'Purchase Predicted' : 'Abandon Predicted'}</strong>
                      <span className="activity-prob">{(activity.probability * 100).toFixed(1)}% confidence</span>
                    </div>
                    <div className="activity-meta">
                      {activity.time} • {activity.model}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <Activity size={32} />
                <p>No recent activity. Make a prediction to see live updates!</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Probability Trend */}
        <div className="chart-card">
          <h3>Real-Time Probability Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="probability" stroke="#667eea" fillOpacity={1} fill="url(#colorProb)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Weekly Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="predictions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name="Predictions" />
              <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Customer Intent Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={intentDist} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name}: ${(percent*100).toFixed(0)}%`}>
                {intentDist.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card full-width">
        <h3>Model Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={modelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="model" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <Legend />
            <Bar dataKey="accuracy" fill="#3b82f6" radius={[8,8,0,0]} name="Accuracy %" />
            <Bar dataKey="recall" fill="#10b981" radius={[8,8,0,0]} name="Recall %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="action-buttons">
        <button onClick={() => setCurrentPage('predictor')} className="action-btn gradient-blue">
          <Brain size={32} />
          <div className="action-title">Make Prediction</div>
          <div className="action-subtitle">Analyze customer intent</div>
        </button>

        <button onClick={() => setCurrentPage('history')} className="action-btn gradient-purple">
          <History size={32} />
          <div className="action-title">View History</div>
          <div className="action-subtitle">Past predictions</div>
        </button>

        <button className="action-btn gradient-green">
          <Download size={32} />
          <div className="action-title">Export Report</div>
          <div className="action-subtitle">Download analytics</div>
        </button>
      </div>
    </div>
  );

  const renderPredictor = () => (
    <div className="page-content">
      <div className="page-header">
        <h2>Purchase Intent Predictor</h2>
        <p>Analyze customer behavior in real-time</p>
      </div>

      <div className="examples-card">
        <div className="examples-header">
          <Zap size={20} />
          <span>Quick Start Examples:</span>
        </div>
        <div className="examples-grid">
          {exampleScenarios.map((scenario, idx) => (
            <button key={idx} onClick={() => loadExample(scenario)} className="example-btn">
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={24} />
          <div>
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="predictor-layout">
        <div className="input-card">
          <h3>Customer Session Data</h3>

          <div className="form-section">
            <h4>BROWSING BEHAVIOR</h4>
            <div className="input-grid-3">
              <div className="input-group">
                <label>Admin Pages</label>
                <input type="number" min="0" value={formData.Administrative} onChange={(e) => handleInputChange('Administrative', parseInt(e.target.value) || 0)} />
              </div>
              <div className="input-group">
                <label>Info Pages</label>
                <input type="number" min="0" value={formData.Informational} onChange={(e) => handleInputChange('Informational', parseInt(e.target.value) || 0)} />
              </div>
              <div className="input-group highlight">
                <label>Product Pages ⭐</label>
                <input type="number" min="0" value={formData.ProductRelated} onChange={(e) => handleInputChange('ProductRelated', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>ENGAGEMENT METRICS</h4>
            <div className="input-grid-2">
              <div className="input-group">
                <label>Bounce Rate (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" value={formData.BounceRates} onChange={(e) => handleInputChange('BounceRates', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="input-group highlight">
                <label>Page Value ($) ⭐</label>
                <input type="number" step="0.1" min="0" value={formData.PageValues} onChange={(e) => handleInputChange('PageValues', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>SESSION CONTEXT</h4>
            <div className="input-grid-2">
              <div className="input-group">
                <label>Month</label>
                <select value={formData.Month} onChange={(e) => handleInputChange('Month', e.target.value)}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Visitor Type</label>
                <select value={formData.VisitorType} onChange={(e) => handleInputChange('VisitorType', e.target.value)}>
                  <option value="Returning_Visitor">Returning Visitor</option>
                  <option value="New_Visitor">New Visitor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="toggle-section">
            <span>Weekend Session?</span>
            <label className="toggle">
              <input type="checkbox" checked={formData.Weekend} onChange={(e) => handleInputChange('Weekend', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="input-group">
            <label>AI Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="model-select">
              <option value="xgboost">🏆 XGBoost (Best Recall)</option>
              <option value="random_forest">🎯 Random Forest (Most Accurate)</option>
              <option value="logistic">⚡ Logistic Regression</option>
              <option value="ensemble">🔮 Ensemble</option>
            </select>
          </div>

          <button onClick={handlePredict} disabled={loading} className="predict-btn">
            {loading ? (
              <>
                <div className="spinner"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={20} />
                Predict Purchase Intent
              </>
            )}
          </button>
        </div>

        <div className="result-card">
          <h3>Prediction Result</h3>

          {prediction ? (
            <div className="result-content">
              <div className={`result-badge ${prediction.prediction === 1 ? 'success' : 'danger'}`}>
                {prediction.prediction === 1 ? (
                  <CheckCircle size={48} />
                ) : (
                  <XCircle size={48} />
                )}
                <div className="result-info">
                  <h4>{prediction.prediction === 1 ? 'Will Purchase' : 'Will Abandon'}</h4>
                  <p>Confidence: {prediction.confidence}</p>
                </div>
              </div>

              <div className="probability-section">
                <div className="probability-header">
                  <span>Purchase Probability</span>
                  <span className="probability-value">{(prediction.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="probability-bar">
                  <div className={`probability-fill ${prediction.prediction === 1 ? 'success' : 'danger'}`} style={{width: `${prediction.probability*100}%`}}></div>
                </div>
              </div>

              <div className="factors-section">
                <h4>Top Influencing Factors</h4>
                {prediction.top_features.map((feat, idx) => (
                  <div key={idx} className="factor-item">
                    <div className="factor-badge">{idx + 1}</div>
                    <span className="factor-name">{feat.feature.replace(/_/g, ' ')}</span>
                    <span className="factor-value">{(feat.importance*100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div className="recommendation-box">
                <h4>💡 Recommended Action</h4>
                <p>{prediction.recommendation}</p>
              </div>

              <button onClick={() => setPrediction(null)} className="secondary-btn">
                Analyze Another Customer
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <Brain size={64} />
              <p>Enter customer data and click predict to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="page-content">
      <div className="page-header">
        <h2>Prediction History</h2>
        <p>View all past predictions and outcomes</p>
      </div>

      {predictionHistory.length === 0 ? (
        <div className="empty-history">
          <History size={64} />
          <h3>No Predictions Yet</h3>
          <p>Make your first prediction to see history here</p>
          <button onClick={() => setCurrentPage('predictor')} className="primary-btn">
            Make First Prediction
          </button>
        </div>
      ) : (
        <div className="history-list">
          {predictionHistory.map((item, idx) => (
            <div key={idx} className="history-item">
              <div className="history-status">
                {item.prediction === 1 ? (
                  <CheckCircle size={32} className="success-icon" />
                ) : (
                  <XCircle size={32} className="danger-icon" />
                )}
              </div>
              <div className="history-details">
                <div className="history-title">{item.prediction === 1 ? 'Purchase' : 'Abandon'}</div>
                <div className="history-time">{item.timestamp}</div>
                <div className="history-meta">
                  Product Pages: {item.formData.ProductRelated} • Page Value: ${item.formData.PageValues}
                  {item.responseTime && ` • ${item.responseTime}ms`}
                </div>
              </div>
              <div className="history-probability">
                <div className="probability-big">{(item.probability*100).toFixed(1)}%</div>
                <div className="confidence-badge">{item.confidence}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMonitoring = () => {
    if (monitoringLoading && !metrics) {
      return (
        <div className="page-content">
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'white' }}>Loading metrics...</p>
          </div>
        </div>
      );
    }

    if (monitoringError) {
      return (
        <div className="page-content">
          <div className="error-alert">
            <AlertCircle size={24} />
            <div>
              <h4>Error Loading Metrics</h4>
              <p>{monitoringError}</p>
            </div>
          </div>
        </div>
      );
    }

    const riskDistData = metrics?.risk_distribution ? Object.entries(metrics.risk_distribution).map(([name, value]) => ({
      name,
      value,
      color: name === 'CRITICAL' ? '#ef4444' : name === 'HIGH' ? '#f59e0b' : name === 'MEDIUM' ? '#3b82f6' : '#10b981'
    })) : [];

    const modelUsageData = metrics?.requests_by_model ? Object.entries(metrics.requests_by_model).map(([model, count]) => ({
      model: model.replace('_', ' ').toUpperCase(),
      requests: count
    })) : [];

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2>API Monitoring Dashboard</h2>
            <p>Real-time performance metrics and system health</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{
              background: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: '#667eea',
              fontWeight: '600'
            }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <div className="live-badge pulse-animation">
              <Activity size={16} />
              <span>LIVE</span>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card gradient-blue">
            <div className="stat-icon"><Target size={40} /></div>
            <div className="stat-value">{metrics?.total_requests || 0}</div>
            <div className="stat-label">Total API Calls</div>
          </div>
          <div className="stat-card gradient-green">
            <div className="stat-icon"><Clock size={40} /></div>
            <div className="stat-value">{metrics?.avg_response_time_ms || 0}ms</div>
            <div className="stat-label">Avg Response Time</div>
          </div>
          <div className="stat-card gradient-orange">
            <div className="stat-icon"><AlertCircle size={40} /></div>
            <div className="stat-value">{metrics?.error_rate || 0}%</div>
            <div className="stat-label">Error Rate</div>
          </div>
          <div className="stat-card gradient-purple">
            <div className="stat-icon"><CheckCircle size={40} /></div>
            <div className="stat-value">{metrics?.uptime || 'operational'}</div>
            <div className="stat-label">System Status</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <h3>Risk Level Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskDistData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, value}) => value > 0 ? `${name}: ${value}` : ''}>
                  {riskDistData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Model Usage Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="model" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="requests" fill="#667eea" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Recent API Requests</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Risk Level</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Model</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.recent_requests?.slice(-10).reverse().map((req, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: req.risk_level === 'CRITICAL' ? '#fee2e2' :
                                   req.risk_level === 'HIGH' ? '#fef3c7' :
                                   req.risk_level === 'MEDIUM' ? '#dbeafe' : '#d1fae5',
                        color: req.risk_level === 'CRITICAL' ? '#991b1b' :
                               req.risk_level === 'HIGH' ? '#92400e' :
                               req.risk_level === 'MEDIUM' ? '#1e40af' : '#065f46'
                      }}>
                        {req.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', textTransform: 'capitalize' }}>
                      {req.model?.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                      {req.response_time_ms?.toFixed(2)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <ShoppingCart size={28} />
            </div>
            <div className="header-title">
              <h1>Purchase Intent Predictor</h1>
              <p>AI-powered customer analytics</p>
            </div>
          </div>
          <div className="header-badge">
            <Zap size={16} />
            <span>Real-Time AI</span>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className="nav-content">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'predictor', label: 'Predictor', icon: Brain },
            { id: 'history', label: 'History', icon: History },
            { id: 'monitoring', label: 'Monitoring', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setCurrentPage(tab.id)} className={`nav-btn ${currentPage === tab.id ? 'active' : ''}`}>
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'predictor' && renderPredictor()}
        {currentPage === 'history' && renderHistory()}
        {currentPage === 'monitoring' && renderMonitoring()}
      </main>

      <footer className="app-footer">
        <p>Built with FastAPI + React • ML Project • 2025</p>
      </footer>
    </div>
  );
}

export default App;