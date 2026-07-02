import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { XCircle, Landmark, Share2} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ReceiptModalProps } from '../types';
import { generateReceiptHTML } from '../utility/receipt';

export default function ReceiptModal({ profile, payment, onClose }: ReceiptModalProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedReceiptId, setCopiedReceiptId] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!payment) return null;

  // Raw text description for standard text shares
  const getReceiptShareText = (receipt: any) => {
    if (!receipt) return '';
    return `📄 *SHARMA NEWSPAPER AGENCY*\n----------------------------------------\n*PAYMENT RECEIPT*\n\n*Receipt No:* ${receipt.receiptNumber}\n*Date:* ${receipt.paymentDate}\n*Customer:* ${receipt.customerName}\n*Phone:* +91 ${receipt.phone}\n*Month/Year:* ${receipt.month} ${receipt.year}\n*Payment Mode:* ${receipt.paymentMode}\n\n----------------------------------------\n*Bill Amount:* ₹${receipt.billAmount}\n*Discount:* -₹${receipt.discount || 0}\n*Late Fee:* +₹${receipt.lateFee || 0}\n----------------------------------------\n*Net Amount Paid:* ₹${receipt.paidAmount}\n*Remaining Balance:* ₹${receipt.balance || 0}\n----------------------------------------\nThank you for your prompt payment! 🌟\n_Computer generated receipt._`;
  };

  // 2. Generate and Share PDF from the custom HTML template
  const handlePdfShare = async () => {
    setIsGeneratingPdf(true);
    try {
      const htmlContent = generateReceiptHTML(profile, payment);

      // Generate PDF File
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true, // false
      });


      // Launch native sharing container
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt_${payment.receiptNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
      }
    } catch (error) {
      console.error('PDF Generation Failure:', error);
      Alert.alert('Error', 'Could not generate and share PDF Receipt.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * 
   * const dHandleWhatsAppShare = async (phone: any, uri:any) => {
    const Share = (await import('react-native-share')).default;
    const recipientNumber = `91${phone}`;

    // 2. Define your file. This can be a local file URI or a base64 string
    // Example using a base64 encoded PDF file
    const fileUrl = `data:application/pdf;base64,${uri}`
    console.log(fileUrl)

    const shareOptions: any = {
      appId: "com.whatsapp",
      title: 'Share Document',
      message: 'Here is your requested document.', // Optional text accompanied with the file
      url: fileUrl,                              // The file path or base64 data uri
      social: Share.Social.WHATSAPP,             // Force opens WhatsApp directly
      whatsAppNumber: recipientNumber,           // Targets the unsaved number explicitly
      type: 'application/pdf',                  // Specify the exact mime type of the file
      filename: 'Invoice_Report',                // Preferred file name (mainly for Android)
    };

    try {
      // Direct sharing bypasses the default system system share sheet
      const shareResponse = await Share.shareSingle(shareOptions);
      console.log('Share successful:', shareResponse);
    } catch (error) {
      console.log('Error sharing to WhatsApp:', error);
      Alert.alert("Sharing Failed", "Make sure WhatsApp is installed on this device.");
    }
  }
   */

  const handleCopyToClipboard = (text: string) => {
    setCopiedReceiptId(true);
    setTimeout(() => setCopiedReceiptId(false), 2000);
    Alert.alert("Copied", "Receipt text description copied successfully!");
  };

  const handleWhatsAppShare = (receipt: any) => {
    const text = getReceiptShareText(receipt);
    const url = `https://wa.me/91${receipt.phone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open WhatsApp.");
      handleCopyToClipboard(text);
    });
  };

  const handleEmailShare = (receipt: any) => {
    const text = getReceiptShareText(receipt);
    const url = `mailto:?subject=${encodeURIComponent(`Payment Receipt - ${profile.businessName}`)}&body=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not trigger email draft.");
    });
  };

  return (
    <View style={styles.backdrop} id="receipt-print-modal">
      <View style={styles.modalCard}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <XCircle size={22} color="#94a3b8" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Landmark size={20} color="#0284c7" />
            </View>
            <Text style={styles.title}>{profile.businessName}</Text>
            <Text style={styles.subtitle}>Distributor Receipt • Mob: {profile.phone}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PAYMENT RECEIPT</Text>
            </View>
          </View>

          <View style={styles.fieldsContainer}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Receipt No:</Text>
              <Text style={styles.fieldValueMono}>{payment.receiptNumber}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date Received:</Text>
              <Text style={styles.fieldValue}>{payment.paymentDate}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Customer Name:</Text>
              <Text style={[styles.fieldValue, styles.bold]}>{payment.customerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Mobile Phone:</Text>
              <Text style={styles.fieldValue}>{payment.phone}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>For Month:</Text>
              <Text style={[styles.fieldValue, styles.bold]}>{payment.month} {payment.year}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Payment Method:</Text>
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{payment.paymentMode}</Text>
              </View>
            </View>
          </View>

          <View style={styles.breakdownBox}>
            <View style={styles.fieldRow}>
              <Text style={styles.breakdownLabel}>Newspaper Bill Amount:</Text>
              <Text style={styles.breakdownValue}>₹{payment.billAmount}</Text>
            </View>
            {payment.discount > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.discountLabel}>Discount (Granted):</Text>
                <Text style={styles.discountValue}>-₹{payment.discount}</Text>
              </View>
            ) : null}
            {payment.lateFee > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.lateLabel}>Late Payment Fee:</Text>
                <Text style={styles.lateValue}>+₹{payment.lateFee}</Text>
              </View>
            ) : null}
            <View style={[styles.fieldRow, styles.netPaidRow]}>
              <Text style={styles.netPaidLabel}>Net Amount Paid:</Text>
              <Text style={styles.netPaidValue}>₹{payment.paidAmount}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.balanceLabel}>Remaining Balance:</Text>
              <Text style={styles.balanceValue}>₹{payment.balance}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerThankyou}>Thank you for your prompt payment! 🌟</Text>
            <Text style={styles.footerNote}>Computer generated. Seal & Signature not required.</Text>

            <View style={styles.sharesGroup}>
              <View style={styles.sharesButtonsRow}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => {
                    handlePdfShare();
                    setShowShareOptions(!showShareOptions)
                  }}
                >
                  <Share2 size={14} color="#ffffff" />
                  <Text style={styles.actionBtnPrimaryText}>
                    {showShareOptions ? 'Hide Share Options' : 'Share Receipt'}
                  </Text>
                </TouchableOpacity>
              </View>
              {isGeneratingPdf && <ActivityIndicator size="small" color="#ffffff" />}
              {/* todo-next release {showShareOptions ? (
                <View style={styles.shareMenu}>
                  <TouchableOpacity
                    style={[styles.shareOptionBtn, styles.shareOptionBtnGreen]}
                    onPress={() => handleWhatsAppShare(payment)}
                  >
                    <MessageSquare size={14} color="#ffffff" />
                    <Text style={styles.shareOptionTextWhite}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shareOptionBtn, styles.shareOptionBtnSlate]}
                    onPress={() => handleEmailShare(payment)}
                  >
                    <Mail size={14} color="#ffffff" />
                    <Text style={styles.shareOptionTextWhite}>Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shareOptionBtn, styles.shareOptionBtnBlue]}
                    onPress={handlePdfShare}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <FileText size={14} color="#ffffff" />
                    )}
                    <Text style={styles.shareOptionTextWhite}>PDF Receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shareOptionBtn, styles.shareOptionBtnWhite]}
                    onPress={() => handleCopyToClipboard(getReceiptShareText(payment))}
                  >
                    {copiedReceiptId ? (
                      <Check size={14} color="#047857" />
                    ) : (
                      <Copy size={14} color="#475569" />
                    )}
                    <Text style={copiedReceiptId ? styles.shareOptionTextGreen : styles.shareOptionTextDark}>
                      {copiedReceiptId ? 'Copied!' : 'Copy Text'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null} */}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14, right: 14,
    zIndex: 10,
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderStyle: 'dashed',
    paddingBottom: 14,
    marginBottom: 14,
  },
  iconContainer: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '900',
  },
  fieldsContainer: {
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderStyle: 'dashed',
    paddingBottom: 14,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  fieldValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  fieldValueMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0f172a',
  },
  bold: {
    fontWeight: '900',
    color: '#0f172a',
  },
  methodBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#475569',
    textTransform: 'uppercase',
  },
  breakdownBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  discountValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  lateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  lateValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  netPaidRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  netPaidLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  netPaidValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10b981',
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
  balanceValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  footer: {
    alignItems: 'center',
    gap: 6,
  },
  footerThankyou: {
    fontSize: 10,
    fontWeight: '900',
    color: '#334155',
  },
  footerNote: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
  },
  sharesGroup: {
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  sharesButtonsRow: {
    flexDirection: 'row',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#0284c7',
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  shareMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shareOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexGrow: 1,
    minWidth: '45%',
  },
  shareOptionBtnGreen: {
    backgroundColor: '#16a34a',
  },
  shareOptionBtnSlate: {
    backgroundColor: '#334155',
  },
  shareOptionBtnBlue: {
    backgroundColor: '#0284c7',
  },
  shareOptionBtnWhite: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  shareOptionTextWhite: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  shareOptionTextDark: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
  },
  shareOptionTextGreen: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '900',
  },
});