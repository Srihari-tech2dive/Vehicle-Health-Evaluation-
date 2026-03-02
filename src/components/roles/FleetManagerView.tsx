'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, LearningInsight, EvaluationRule, DriverFeedback, Alert } from '@/lib/types';
import { 
  Brain, 
  TrendingUp, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Clock,
  User,
  Car,
  Truck,
  Bike,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface FleetManagerViewProps {
  vehicles: Vehicle[];
  alerts: Alert[];
  insights: LearningInsight[];
  rules: EvaluationRule[];
  feedbacks: DriverFeedback[];
  onRunLearning: () => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onUpdateFeedbackStatus: (feedbackId: string, status: 'pending' | 'acknowledged' | 'resolved') => void;
}

export function FleetManagerView({
  vehicles,
  alerts,
  insights,
  rules,
  feedbacks,
  onRunLearning,
  onToggleRule,
  onUpdateFeedbackStatus
}: FleetManagerViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'rules' | 'feedback'>('overview');
  const [isLearning, setIsLearning] = useState(false);
  
  // Calculate fleet trends
  const healthTrend = vehicles.reduce((acc, v) => {
    v.healthHistory.forEach((h, i) => {
      if (!acc[i]) acc[i] = { date: h.timestamp, total: 0, count: 0 };
      acc[i].total += h.healthScore;
      acc[i].count++;
    });
    return acc;
  }, [] as { date: Date; total: number; count: number }[]).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(d.total / d.count)
  }));
  
  const handleRunLearning = async () => {
    setIsLearning(true);
    onRunLearning();
    setTimeout(() => setIsLearning(false), 2000);
  };
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'learning', label: 'AI Learning', icon: <Brain className="w-4 h-4" /> },
          { id: 'rules', label: 'Rules', icon: <Settings className="w-4 h-4" /> },
          { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Fleet Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FleetStat
                title="Total Vehicles"
                value={vehicles.length}
                icon={<Activity className="w-5 h-5" />}
                color="#6366f1"
              />
              <FleetStat
                title="Healthy"
                value={vehicles.filter(v => v.healthStatus === 'healthy').length}
                icon={<CheckCircle className="w-5 h-5" />}
                color="#10b981"
              />
              <FleetStat
                title="Warning"
                value={vehicles.filter(v => v.healthStatus === 'warning').length}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="#f59e0b"
              />
              <FleetStat
                title="Critical"
                value={vehicles.filter(v => v.healthStatus === 'critical').length}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="#ef4444"
              />
            </div>
            
            {/* Health Trend Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Fleet Health Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthTrend}>
                    <defs>
                      <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(20, 20, 35, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fill="url(#healthGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Vehicle Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DistributionCard
                title="Cars"
                count={vehicles.filter(v => v.category === 'car').length}
                total={vehicles.length}
                icon={<Car className="w-6 h-6" />}
                color="#6366f1"
              />
              <DistributionCard
                title="Two-Wheelers"
                count={vehicles.filter(v => v.category === 'two-wheeler').length}
                total={vehicles.length}
                icon={<Bike className="w-6 h-6" />}
                color="#10b981"
              />
              <DistributionCard
                title="Heavy Vehicles"
                count={vehicles.filter(v => v.category === 'heavy').length}
                total={vehicles.length}
                icon={<Truck className="w-6 h-6" />}
                color="#f59e0b"
              />
            </div>
            
            {/* Recent Alerts */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {alerts.slice(0, 5).map(alert => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No alerts</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <motion.div
            key="learning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Learning Controls */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Recursive Learning Engine
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system learns from vehicle data to improve predictions
                  </p>
                </div>
                <motion.button
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isLearning ? 'bg-primary/50' : 'bg-primary'
                  } text-white`}
                  onClick={handleRunLearning}
                  disabled={isLearning}
                  whileHover={{ scale: isLearning ? 1 : 1.05 }}
                  whileTap={{ scale: isLearning ? 1 : 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${isLearning ? 'animate-spin' : ''}`} />
                  {isLearning ? 'Learning...' : 'Run Learning'}
                </motion.button>
              </div>
              
              {/* Learning Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-2xl font-bold text-primary">89%</p>
                  <p className="text-xs text-muted-foreground">Avg. Accuracy</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{rules.filter(r => r.learnedFromData).length}</p>
                  <p className="text-xs text-muted-foreground">Learned Rules</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-2xl font-bold text-amber-400">{insights.length}</p>
                  <p className="text-xs text-muted-foreground">Insights</p>
                </div>
              </div>
            </div>
            
            {/* Learning Insights */}
            <div className="glass-card p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Recent Insights
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <InsightCard key={insight.id} insight={insight} index={index} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Evaluation Rules
              </h3>
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <RuleCard 
                    key={rule.id} 
                    rule={rule} 
                    index={index}
                    onToggle={(enabled) => onToggleRule(rule.id, enabled)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Driver Feedback
              </h3>
              
              {feedbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No feedback submitted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((feedback, index) => (
                    <FeedbackCard 
                      key={feedback.id} 
                      feedback={feedback}
                      index={index}
                      vehicleName={vehicles.find(v => v.id === feedback.vehicleId)?.name || 'Unknown'}
                      onUpdateStatus={(status) => onUpdateFeedbackStatus(feedback.id, status)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FleetStat({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="text-3xl font-bold number-display" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function DistributionCard({ title, count, total, icon, color }: {
  title: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{count}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{percentage}% of fleet</p>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const colors = {
    critical: 'border-red-500/30 bg-red-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    info: 'border-blue-500/30 bg-blue-500/10'
  };
  
  const textColors = {
    critical: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colors[alert.type]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{alert.vehicleName}</p>
          <p className={`text-sm ${textColors[alert.type]}`}>{alert.message}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: LearningInsight; index: number }) {
  const colors = {
    threshold_adjustment: 'border-blue-500/30 bg-blue-500/10',
    new_pattern: 'border-emerald-500/30 bg-emerald-500/10',
    accuracy_improvement: 'border-purple-500/30 bg-purple-500/10'
  };
  
  const icons = {
    threshold_adjustment: <Settings className="w-4 h-4 text-blue-400" />,
    new_pattern: <Zap className="w-4 h-4 text-emerald-400" />,
    accuracy_improvement: <TrendingUp className="w-4 h-4 text-purple-400" />
  };
  
  return (
    <motion.div
      className={`p-4 rounded-lg border ${colors[insight.type]}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start gap-3">
        {icons[insight.type]}
        <div className="flex-1">
          <p className="text-sm">{insight.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(insight.confidence * 100)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(insight.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RuleCard({ rule, index, onToggle }: { 
  rule: EvaluationRule; 
  index: number;
  onToggle: (enabled: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div
      className="p-4 rounded-lg bg-white/5 border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${rule.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
          <div>
            <p className="font-medium">{rule.name}</p>
            <p className="text-sm text-muted-foreground">
              {rule.metric} {rule.operator} {rule.threshold}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {rule.learnedFromData && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
              AI Learned
            </span>
          )}
          <span className="text-sm text-muted-foreground">{rule.accuracy}% acc</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded hover:bg-white/10"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => onToggle(!rule.enabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              rule.enabled ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
              rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Applicable Contexts</p>
                <div className="flex gap-2 mt-1">
                  {rule.applicableContext.map(ctx => (
                    <span key={ctx} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                      {ctx}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Severity</p>
                <p className={rule.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                  {rule.severity}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeedbackCard({ feedback, index, vehicleName, onUpdateStatus }: {
  feedback: DriverFeedback;
  index: number;
  vehicleName: string;
  onUpdateStatus: (status: 'pending' | 'acknowledged' | 'resolved') => void;
}) {
  const severityColors = {
    low: 'text-green-400 bg-green-500/20 border-green-500/30',
    medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    critical: 'text-red-400 bg-red-500/20 border-red-500/30'
  };
  
  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400',
    acknowledged: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-emerald-500/20 text-emerald-400'
  };
  
  return (
    <motion.div
      className="p-4 rounded-lg bg-white/5 border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium">{vehicleName}</p>
          <p className="text-sm text-muted-foreground">{feedback.issueType}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityColors[feedback.severity]}`}>
          {feedback.severity}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{feedback.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {feedback.driverName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(feedback.timestamp).toLocaleString()}
          </span>
        </div>
        
        <div className="flex gap-1">
          {(['pending', 'acknowledged', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => onUpdateStatus(status)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                feedback.status === status
                  ? statusColors[status]
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
