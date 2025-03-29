import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { format } from 'date-fns';

const SyncHistory = ({ visible, onClose, history }) => {
  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
  };

  const getAlignmentQuality = (alignment) => {
    const horizontal = Math.abs(alignment.horizontal);
    const vertical = Math.abs(alignment.vertical);
    const avg = (horizontal + vertical) / 2;
    return Math.round((1 - avg) * 100);
  };

  const renderHistoryItem = (item, index) => {
    const quality = getAlignmentQuality(item.alignment);
    const qualityColor = quality > 90 ? '#4CAF50' : quality > 70 ? '#FFC107' : '#F44336';

    return (
      <View key={index} style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          <Text style={styles.duration}>{item.duration}</Text>
        </View>
        
        <View style={styles.historyDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{Math.round(item.alignment.distance)}cm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Alignment Quality:</Text>
            <Text style={[styles.detailValue, { color: qualityColor }]}>
              {quality}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Horizontal:</Text>
            <Text style={styles.detailValue}>
              {Math.round(item.alignment.horizontal * 100)}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vertical:</Text>
            <Text style={styles.detailValue}>
              {Math.round(item.alignment.vertical * 100)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.historyContainer}>
          <Text style={styles.title}>Sync History</Text>
          
          <ScrollView style={styles.historyList}>
            {history.length > 0 ? (
              history.map((item, index) => renderHistoryItem(item, index))
            ) : (
              <Text style={styles.emptyText}>No sync history available</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  historyContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  historyList: {
    maxHeight: 400
  },
  historyItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  timestamp: {
    fontSize: 14,
    color: '#666'
  },
  duration: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize'
  },
  historyDetails: {
    gap: 5
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#333'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20
  },
  closeButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SyncHistory; 