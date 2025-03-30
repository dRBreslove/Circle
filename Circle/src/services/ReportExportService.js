import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatDate } from '../utils/formatters';

class ReportExportService {
  async exportToCSV(report, filename) {
    try {
      const csvContent = this.generateCSVContent(report);
      const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export Report - ${formatDate(new Date())}`,
        });
      }
      
      return fileUri;
    } catch (error) {
      console.error('Error exporting report to CSV:', error);
      throw error;
    }
  }

  async exportToPDF(report, filename) {
    try {
      const pdfContent = this.generatePDFContent(report);
      const fileUri = `${FileSystem.documentDirectory}${filename}.pdf`;
      
      await FileSystem.writeAsStringAsync(fileUri, pdfContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export Report - ${formatDate(new Date())}`,
        });
      }
      
      return fileUri;
    } catch (error) {
      console.error('Error exporting report to PDF:', error);
      throw error;
    }
  }

  generateCSVContent(report) {
    const rows = [];

    // Summary section
    rows.push(['Summary']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Transactions', report.summary.totalTransactions]);
    rows.push(['Total Volume', report.summary.totalVolume]);
    rows.push(['Success Rate', `${(report.summary.successRate * 100).toFixed(1)}%`]);
    rows.push(['Average Processing Time', `${Math.round(report.summary.averageProcessingTime / 1000)}s`]);
    rows.push([]);

    // Currency details
    rows.push(['Currency Details']);
    rows.push(['Currency', 'Transactions', 'Volume', 'Success Rate']);
    Object.entries(report.details.byCurrency).forEach(([currency, data]) => {
      rows.push([
        currency,
        data.count,
        data.volume,
        `${((data.successRate / data.count) * 100).toFixed(1)}%`,
      ]);
    });
    rows.push([]);

    // Error analysis
    rows.push(['Error Analysis']);
    rows.push(['Network', 'Error Count']);
    Object.entries(report.details.errorAnalysis.byNetwork).forEach(([network, count]) => {
      rows.push([network, count]);
    });
    rows.push([]);
    rows.push(['Common Issues']);
    rows.push(['Issue', 'Count']);
    report.details.errorAnalysis.commonIssues.forEach(({ issue, count }) => {
      rows.push([issue, count]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  generatePDFContent(report) {
    // This is a simplified version. In a real implementation,
    // you would use a PDF generation library like react-native-html-to-pdf
    const content = `
      Crypto Payment System Report
      Generated on: ${formatDate(new Date())}
      
      Summary
      -------
      Total Transactions: ${report.summary.totalTransactions}
      Total Volume: ${report.summary.totalVolume}
      Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%
      Average Processing Time: ${Math.round(report.summary.averageProcessingTime / 1000)}s
      
      Currency Details
      ---------------
      ${Object.entries(report.details.byCurrency)
        .map(([currency, data]) => `
          ${currency}:
          - Transactions: ${data.count}
          - Volume: ${data.volume}
          - Success Rate: ${((data.successRate / data.count) * 100).toFixed(1)}%
        `)
        .join('\n')}
      
      Error Analysis
      -------------
      By Network:
      ${Object.entries(report.details.errorAnalysis.byNetwork)
        .map(([network, count]) => `- ${network}: ${count}`)
        .join('\n')}
      
      Common Issues:
      ${report.details.errorAnalysis.commonIssues
        .map(({ issue, count }) => `- ${issue}: ${count}`)
        .join('\n')}
    `;

    return content;
  }

  async exportToExcel(report, filename) {
    try {
      const excelContent = this.generateExcelContent(report);
      const fileUri = `${FileSystem.documentDirectory}${filename}.xlsx`;
      
      await FileSystem.writeAsStringAsync(fileUri, excelContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Export Report - ${formatDate(new Date())}`,
        });
      }
      
      return fileUri;
    } catch (error) {
      console.error('Error exporting report to Excel:', error);
      throw error;
    }
  }

  generateExcelContent(report) {
    // This is a placeholder. In a real implementation,
    // you would use a library like xlsx to generate Excel files
    return this.generateCSVContent(report);
  }
}

export default new ReportExportService(); 