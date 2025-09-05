import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Navigation, Download, RotateCcw, MapPin } from 'lucide-react-native';
import { useRouteStore } from '@/stores/route-store';
import { geocodeAddress, optimizeRoute } from '@/utils/route-utils';

export default function RouteScreen() {
  const { addresses, optimizedRoute, setOptimizedRoute } = useRouteStore();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);

  const handleOptimizeRoute = async () => {
    if (addresses.length < 2) {
      Alert.alert('Indirizzi Insufficienti', 'Aggiungi almeno 2 indirizzi per ottimizzare il percorso.');
      return;
    }

    setIsOptimizing(true);
    try {
      console.log('Starting route optimization...');
      
      // Geocode all addresses
      const geocodedAddresses = [];
      for (const addr of addresses) {
        console.log(`Geocoding: ${addr.address}`);
        const coords = await geocodeAddress(addr.address);
        if (coords) {
          geocodedAddresses.push({
            ...addr,
            lat: coords.lat,
            lon: coords.lon,
          });
        }
      }

      if (geocodedAddresses.length < 2) {
        Alert.alert('Geocodifica Fallita', 'Impossibile trovare le coordinate per abbastanza indirizzi.');
        return;
      }

      console.log(`Geocoded ${geocodedAddresses.length} addresses`);
      
      // Optimize route
      const optimized = optimizeRoute(geocodedAddresses);
      setOptimizedRoute(optimized);
      
      // Calculate total distance
      let distance = 0;
      for (let i = 0; i < optimized.length - 1; i++) {
        const d = calculateDistance(
          optimized[i].lat,
          optimized[i].lon,
          optimized[i + 1].lat,
          optimized[i + 1].lon
        );
        distance += d;
      }
      setTotalDistance(distance);
      
      console.log('Route optimization completed');
    } catch (error) {
      console.error('Route optimization error:', error);
      Alert.alert('Errore', 'Impossibile ottimizzare il percorso. Riprova.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleExportCSV = () => {
    if (!optimizedRoute || optimizedRoute.length === 0) {
      Alert.alert('Nessun Percorso', 'Ottimizza prima il percorso.');
      return;
    }

    const csvContent = [
      'Order,Address,Latitude,Longitude',
      ...optimizedRoute.map((addr, index) => 
        `${index + 1},"${addr.address}",${addr.lat},${addr.lon}`
      )
    ].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized_route.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Esportazione', 'L\'esportazione CSV è disponibile solo su piattaforma web');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ottimizzazione Percorso</Text>
        <Text style={styles.subtitle}>
          {addresses.length} indirizzo{addresses.length !== 1 ? 'i' : ''} da ottimizzare
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.optimizeButton, isOptimizing && styles.optimizeButtonDisabled]}
          onPress={handleOptimizeRoute}
          disabled={isOptimizing || addresses.length < 2}
        >
          {isOptimizing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Navigation color="#fff" size={20} />
          )}
          <Text style={styles.optimizeButtonText}>
            {isOptimizing ? 'Ottimizzando...' : 'Ottimizza Percorso'}
          </Text>
        </TouchableOpacity>

        {optimizedRoute && optimizedRoute.length > 0 && (
          <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
            <Download color="#2563eb" size={18} />
            <Text style={styles.exportButtonText}>Esporta CSV</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
        {!optimizedRoute || optimizedRoute.length === 0 ? (
          <View style={styles.emptyState}>
            <RotateCcw color="#9ca3af" size={48} />
            <Text style={styles.emptyText}>Nessun percorso ottimizzato</Text>
            <Text style={styles.emptySubtext}>
              Clicca "Ottimizza Percorso" per calcolare il percorso migliore
            </Text>
          </View>
        ) : (
          <>
            {totalDistance && (
              <View style={styles.distanceCard}>
                <Text style={styles.distanceLabel}>Distanza Totale</Text>
                <Text style={styles.distanceValue}>{totalDistance.toFixed(1)} km</Text>
              </View>
            )}
            
            {optimizedRoute.map((address, index) => (
              <View key={index} style={styles.routeItem}>
                <View style={styles.routeNumber}>
                  <Text style={styles.routeNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.routeContent}>
                  <Text style={styles.routeAddress}>{address.address}</Text>
                  {address.isStartPoint && (
                    <Text style={styles.startPointLabel}>PUNTO DI PARTENZA</Text>
                  )}
                  <Text style={styles.routeCoords}>
                    {address.lat?.toFixed(6)}, {address.lon?.toFixed(6)}
                  </Text>
                </View>
                {index < optimizedRoute.length - 1 && (
                  <View style={styles.routeArrow}>
                    <Text style={styles.routeArrowText}>↓</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
    flexDirection: 'row',
    gap: 12,
  },
  optimizeButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  optimizeButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  optimizeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  routeList: {
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
    textAlign: 'center',
  },
  distanceCard: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  distanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  distanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  routeItem: {
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
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  routeContent: {
    flex: 1,
  },
  routeAddress: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 4,
  },
  startPointLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  routeCoords: {
    fontSize: 12,
    color: '#64748b',
  },
  routeArrow: {
    alignItems: 'center',
    marginTop: 8,
  },
  routeArrowText: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
  },
});