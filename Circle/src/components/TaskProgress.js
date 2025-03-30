import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TaskProgress = ({ task, onUpdateProgress, onAddComment }) => {
  const [comment, setComment] = React.useState('');
  const [progress, setProgress] = React.useState(task.progress || 0);

  const handleProgressUpdate = (newProgress) => {
    setProgress(newProgress);
    onUpdateProgress(newProgress);
  };

  const handleAddComment = () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    onAddComment(comment);
    setComment('');
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  const renderProgressButtons = () => (
    <View style={styles.progressButtons}>
      {[0, 25, 50, 75, 100].map((value) => (
        <TouchableOpacity
          key={value}
          style={[
            styles.progressButton,
            progress === value && styles.progressButtonActive
          ]}
          onPress={() => handleProgressUpdate(value)}
        >
          <Text
            style={[
              styles.progressButtonText,
              progress === value && styles.progressButtonTextActive
            ]}
          >
            {value}%
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderComments = () => (
    <View style={styles.commentsSection}>
      <Text style={styles.sectionTitle}>Comments</Text>
      {task.comments && task.comments.length > 0 ? (
        task.comments.map((comment, index) => (
          <View key={index} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentTime}>
                {new Date(comment.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noComments}>No comments yet</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        {renderProgressBar()}
        {renderProgressButtons()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Comment</Text>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.addCommentButton}
            onPress={handleAddComment}
          >
            <MaterialIcons name="send" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {renderComments()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 50,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  progressButtonActive: {
    backgroundColor: '#4CAF50',
  },
  progressButtonText: {
    color: '#666',
    fontSize: 14,
  },
  progressButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
    minHeight: 80,
  },
  addCommentButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  noComments: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TaskProgress; 