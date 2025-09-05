import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Plus, Upload, Trash2, MapPin } from 'lucide-react-native';
import { useRouteStore } from '@/stores/route-store';

export default function AddressesScreen() {
  const [newAddress, setNewAddress] = useState('');
  const { addresses, addAddress, removeAddress, clearAddresses, setStartPoint } = useRouteStore();

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      addAddress(newAddress.trim());
      setNewAddress('');
    }
  };

  const handleCSVUpload = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const csv = event.target?.result as string;
            const lines = csv.split('\n');
            const addresses = lines
              .slice(1) // Skip header
              .map(line => line.trim())
              .filter(line => line.length > 0);
            
            addresses.forEach(address => addAddress(address));
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Caricamento CSV', 'Il caricamento CSV è disponibile solo su piattaforma web');
    }
  };

  const handleSetStartPoint = (address: string) => {
    setStartPoint(address);
    Alert.alert('Punto di Partenza Impostato', `"${address}" è ora il tuo punto di partenza`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Indirizzi di Installazione</Text>
        <Text style={styles.subtitle}>Aggiungi indirizzi per il tuo percorso di installazione</Text>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Inserisci indirizzo (es. Via Roma 123, Milano)"
            value={newAddress}
            onChangeText={setNewAddress}
            onSubmitEditing={handleAddAddress}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.csvButton} onPress={handleCSVUpload}>
            <Upload color="#2563eb" size={18} />
            <Text style={styles.csvButtonText}>Importa CSV</Text>
          </TouchableOpacity>
          
          {addresses.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAddresses}>
              <Trash2 color="#dc2626" size={18} />
              <Text style={styles.clearButtonText}>Cancella Tutto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin color="#9ca3af" size={48} />
            <Text style={styles.emptyText}>Nessun indirizzo aggiunto</Text>
            <Text style={styles.emptySubtext}>Aggiungi indirizzi manualmente o importa da CSV</Text>
          </View>
        ) : (
          addresses.map((address, index) => (
            <View key={index} style={styles.addressItem}>
              <View style={styles.addressContent}>
                <View style={styles.addressNumber}>
                  <Text style={styles.addressNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressText}>{address.address}</Text>
                  {address.isStartPoint && (
                    <Text style={styles.startPointLabel}>PUNTO DI PARTENZA</Text>
                  )}
                </View>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleSetStartPoint(address.address)}
                >
                  <Text style={styles.startButtonText}>Inizio</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeAddress(index)}
                >
                  <Trash2 color="#dc2626" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {addresses.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {addresses.length} indirizzo{addresses.length !== 1 ? 'i' : ''} aggiunto{addresses.length !== 1 ? 'i' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  inputSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 12,
    minHeight: 48,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  csvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  csvButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  addressList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  addressItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addressContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
  },
  startPointLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  startButtonText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
});