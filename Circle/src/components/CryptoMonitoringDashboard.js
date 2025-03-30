import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import CryptoMonitoringService from '../services/CryptoMonitoringService';
import WebSocketService from '../services/WebSocketService';
import { formatCurrency, formatDate } from '../utils/formatters';
import ReportExportService from '../services/ReportExportService';
import AlertService from '../services/AlertService';
import { MaterialIcons } from '@expo/vector-icons';

const CryptoMonitoringDashboard = () => {
  const [health, setHealth] = useState(null);
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  useEffect(() => {
    loadData();
    setupWebSocket();
    loadAlerts();
    return () => {
      WebSocketService.disconnect();
    };
  }, [dateRange]);

  const setupWebSocket = () => {
    WebSocketService.connect();

    const unsubscribeHealth = WebSocketService.subscribeToHealth((data) => {
      setHealth(prev => ({ ...prev, ...data }));
    });

    const unsubscribeTransactions = WebSocketService.subscribeToTransactions((data) => {
      setReport(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          totalTransactions: prev.summary.totalTransactions + 1,
          totalVolume: prev.summary.totalVolume + data.amount,
        },
        details: {
          ...prev.details,
          byCurrency: updateCurrencyData(prev.details.byCurrency, data),
        },
      }));
    });

    const unsubscribeErrors = WebSocketService.subscribeToErrors((data) => {
      setReport(prev => ({
        ...prev,
        details: {
          ...prev.details,
          errorAnalysis: updateErrorAnalysis(prev.details.errorAnalysis, data),
        },
      }));
    });

    return () => {
      unsubscribeHealth();
      unsubscribeTransactions();
      unsubscribeErrors();
    };
  };

  const updateCurrencyData = (currentData, newTransaction) => {
    const currency = newTransaction.currency;
    const amount = newTransaction.amount;

    return {
      ...currentData,
      [currency]: {
        ...currentData[currency],
        count: (currentData[currency]?.count || 0) + 1,
        volume: (currentData[currency]?.volume || 0) + amount,
        successRate: newTransaction.status === 'completed'
          ? (currentData[currency]?.successRate || 0) + 1
          : currentData[currency]?.successRate || 0,
      },
    };
  };

  const updateErrorAnalysis = (currentData, newError) => {
    return {
      ...currentData,
      totalErrors: currentData.totalErrors + 1,
      byType: {
        ...currentData.byType,
        [newError.type]: (currentData.byType[newError.type] || 0) + 1,
      },
      byNetwork: {
        ...currentData.byNetwork,
        [newError.network]: (currentData.byNetwork[newError.network] || 0) + 1,
      },
      commonIssues: updateCommonIssues(currentData.commonIssues, newError),
    };
  };

  const updateCommonIssues = (currentIssues, newError) => {
    const issue = newError.message.split(':')[0];
    const existingIssue = currentIssues.find(i => i.issue === issue);
    
    if (existingIssue) {
      return currentIssues.map(i =>
        i.issue === issue ? { ...i, count: i.count + 1 } : i
      );
    }
    
    return [...currentIssues, { issue, count: 1 }]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const healthData = await CryptoMonitoringService.checkSystemHealth();
      setHealth(healthData);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - parseInt(dateRange));
      
      const reportData = await CryptoMonitoringService.generateReport(startDate, endDate);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const recentAlerts = await AlertService.getRecentAlerts();
      setAlerts(recentAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const filename = `crypto_report_${formatDate(new Date())}`;
      let fileUri;

      switch (format) {
        case 'csv':
          fileUri = await ReportExportService.exportToCSV(report, filename);
          break;
        case 'pdf':
          fileUri = await ReportExportService.exportToPDF(report, filename);
          break;
        case 'excel':
          fileUri = await ReportExportService.exportToExcel(report, filename);
          break;
      }

      console.log(`Report exported to ${fileUri}`);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setShowExportMenu(false);
    }
  };

  const renderHealthStatus = () => {
    if (!health) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: health.status === 'healthy' ? '#4CAF50' : '#FFC107' }
        ]}>
          <Text style={styles.statusText}>{health.status.toUpperCase()}</Text>
        </View>

        <View style={styles.metricsGrid}>
          {Object.entries(health.metrics.nodeStatus).map(([network, status]) => (
            <View key={network} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{network}</Text>
              <View style={[
                styles.statusDot,
                { backgroundColor: status ? '#4CAF50' : '#F44336' }
              ]} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTransactionChart = () => {
    if (!report) return null;

    const data = {
      labels: Object.keys(report.details.byCurrency),
      datasets: [{
        data: Object.values(report.details.byCurrency).map(currency => currency.volume),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Transaction Volume by Currency</Text>
        <PieChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          }}
          accessor="data"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderErrorChart = () => {
    if (!report) return null;

    const data = {
      labels: Object.keys(report.details.errorAnalysis.byNetwork),
      datasets: [{
        data: Object.values(report.details.errorAnalysis.byNetwork),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Errors by Network</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderSummary = () => {
    if (!report) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{report.summary.totalTransactions}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Volume</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.totalVolume)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Success Rate</Text>
            <Text style={styles.summaryValue}>{(report.summary.successRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Processing Time</Text>
            <Text style={styles.summaryValue}>{Math.round(report.summary.averageProcessingTime / 1000)}s</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDateRangeSelector = () => (
    <View style={styles.dateRangeContainer}>
      {['24h', '7d', '30d'].map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.dateRangeButton,
            dateRange === range && styles.dateRangeButtonActive,
          ]}
          onPress={() => setDateRange(range)}
        >
          <Text style={[
            styles.dateRangeText,
            dateRange === range && styles.dateRangeTextActive,
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTransactionDetails = () => {
    if (!report) return null;

    const data = {
      labels: Object.keys(report.details.byCurrency),
      datasets: [{
        data: Object.values(report.details.byCurrency).map(currency => currency.count),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Transaction Count by Currency</Text>
        <BarChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          showBarTops={false}
          fromZero
        />
      </View>
    );
  };

  const renderSuccessRateChart = () => {
    if (!report) return null;

    const data = {
      labels: Object.keys(report.details.byCurrency),
      datasets: [{
        data: Object.values(report.details.byCurrency).map(currency => 
          (currency.successRate / currency.count) * 100
        ),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Success Rate by Currency</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDetailedMetrics = () => {
    if (!report) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Metrics</Text>
        {Object.entries(report.details.byCurrency).map(([currency, data]) => (
          <View key={currency} style={styles.metricCard}>
            <Text style={styles.currencyTitle}>{currency}</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Transactions:</Text>
              <Text style={styles.metricValue}>{data.count}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Volume:</Text>
              <Text style={styles.metricValue}>{formatCurrency(data.volume)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Success Rate:</Text>
              <Text style={styles.metricValue}>
                {((data.successRate / data.count) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {['overview', 'transactions', 'errors'].map((view) => (
        <TouchableOpacity
          key={view}
          style={[
            styles.viewButton,
            selectedView === view && styles.viewButtonActive,
          ]}
          onPress={() => setSelectedView(view)}
        >
          <Text style={[
            styles.viewButtonText,
            selectedView === view && styles.viewButtonTextActive,
          ]}>
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <TouchableOpacity
          onPress={() => setShowAlertSettings(true)}
          style={styles.settingsButton}
        >
          <MaterialIcons name="settings" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {alerts.map((alert, index) => (
        <View
          key={index}
          style={[
            styles.alertItem,
            { borderLeftColor: alert.severity === 'high' ? '#F44336' : '#FFC107' },
          ]}
        >
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>
              {alert.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.alertTime}>
              {formatDate(alert.timestamp)}
            </Text>
          </View>
          <Text style={styles.alertMessage}>{alert.message}</Text>
        </View>
      ))}
    </View>
  );

  const renderAlertSettings = () => {
    const [thresholds, setThresholds] = useState(AlertService.thresholds);

    const handleUpdateThreshold = async (key, value) => {
      const newThresholds = { ...thresholds, [key]: value };
      await AlertService.updateThresholds(newThresholds);
      setThresholds(newThresholds);
    };

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alert Settings</Text>
            <TouchableOpacity
              onPress={() => setShowAlertSettings(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Error Rate Threshold (%)</Text>
            <TextInput
              style={styles.thresholdInput}
              value={(thresholds.errorRate * 100).toString()}
              onChangeText={(value) => handleUpdateThreshold('errorRate', parseFloat(value) / 100)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Success Rate Threshold (%)</Text>
            <TextInput
              style={styles.thresholdInput}
              value={(thresholds.successRate * 100).toString()}
              onChangeText={(value) => handleUpdateThreshold('successRate', parseFloat(value) / 100)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Processing Time Threshold (s)</Text>
            <TextInput
              style={styles.thresholdInput}
              value={(thresholds.processingTime / 1000).toString()}
              onChangeText={(value) => handleUpdateThreshold('processingTime', parseFloat(value) * 1000)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Volume Spike Threshold (x)</Text>
            <TextInput
              style={styles.thresholdInput}
              value={thresholds.volumeSpike.toString()}
              onChangeText={(value) => handleUpdateThreshold('volumeSpike', parseFloat(value))}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderExportMenu = () => (
    <View style={styles.exportMenu}>
      <TouchableOpacity
        style={styles.exportMenuItem}
        onPress={() => handleExport('csv')}
      >
        <MaterialIcons name="file-download" size={24} color="#007AFF" />
        <Text style={styles.exportMenuItemText}>Export as CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exportMenuItem}
        onPress={() => handleExport('pdf')}
      >
        <MaterialIcons name="picture-as-pdf" size={24} color="#007AFF" />
        <Text style={styles.exportMenuItemText}>Export as PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exportMenuItem}
        onPress={() => handleExport('excel')}
      >
        <MaterialIcons name="table-chart" size={24} color="#007AFF" />
        <Text style={styles.exportMenuItemText}>Export as Excel</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Crypto Monitoring Dashboard</Text>
        <TouchableOpacity
          onPress={() => setShowExportMenu(!showExportMenu)}
          style={styles.exportButton}
        >
          <MaterialIcons name="file-download" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {showExportMenu && renderExportMenu()}
      {showAlertSettings && renderAlertSettings()}

      {renderDateRangeSelector()}
      {renderViewSelector()}
      
      {selectedView === 'overview' && (
        <>
          {renderHealthStatus()}
          {renderSummary()}
          {renderTransactionChart()}
          {renderErrorChart()}
          {renderAlerts()}
        </>
      )}

      {selectedView === 'transactions' && (
        <>
          {renderTransactionDetails()}
          {renderSuccessRateChart()}
          {renderDetailedMetrics()}
        </>
      )}

      {selectedView === 'errors' && (
        <>
          {renderErrorChart()}
          {renderErrorDetails()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusIndicator: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  metricItem: {
    alignItems: 'center',
    margin: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  dateRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  dateRangeText: {
    color: '#666',
  },
  dateRangeTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  viewButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewButtonText: {
    color: '#666',
  },
  viewButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  currencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    padding: 8,
  },
  exportMenu: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exportMenuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    padding: 8,
  },
  alertItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  thresholdItem: {
    marginBottom: 16,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  thresholdInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
});

export default CryptoMonitoringDashboard; 