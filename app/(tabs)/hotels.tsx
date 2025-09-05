import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Building2, MapPin, Star, Search } from 'lucide-react-native';
import { useRouteStore } from '@/stores/route-store';
import { calculateCentroid, searchNearbyHotels } from '@/utils/hotel-utils';

interface Hotel {
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  type: string;
  distanceFromLastPoint?: number;
}

export default function HotelsScreen() {
  const { optimizedRoute } = useRouteStore();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [centroid, setCentroid] = useState<{ lat: number; lon: number } | null>(null);

  const handleSearchHotels = async () => {
    if (!optimizedRoute || optimizedRoute.length === 0) {
      Alert.alert('Nessun Percorso', 'Ottimizza prima il tuo percorso per trovare hotel vicini.');
      return;
    }

    // Filter addresses with valid coordinates
    const addressesWithCoords = optimizedRoute.filter(
      (addr): addr is typeof addr & { lat: number; lon: number } => 
        addr.lat !== undefined && addr.lon !== undefined
    );

    if (addressesWithCoords.length === 0) {
      Alert.alert('Errore', 'Nessun indirizzo con coordinate valide trovato.');
      return;
    }

    setIsSearching(true);
    try {
      console.log('Calculating centroid...');
      const center = calculateCentroid(addressesWithCoords);
      setCentroid(center);
      
      console.log(`Searching hotels near centroid: ${center.lat}, ${center.lon}`);
      
      // Get the last point coordinates for prioritizing hotels
      const lastPoint = addressesWithCoords[addressesWithCoords.length - 1];
      const nearbyHotels = await searchNearbyHotels(
        center.lat, 
        center.lon, 
        10, // radius in km
        lastPoint.lat, 
        lastPoint.lon
      );
      setHotels(nearbyHotels);
      
      console.log(`Found ${nearbyHotels.length} hotels`);
    } catch (error) {
      console.error('Hotel search error:', error);
      Alert.alert('Errore', 'Impossibile cercare hotel. Riprova.');
    } finally {
      setIsSearching(false);
    }
  };

  const getHotelTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel':
        return '#2563eb';
      case 'guest_house':
        return '#059669';
      case 'hostel':
        return '#dc2626';
      case 'motel':
        return '#7c3aed';
      default:
        return '#64748b';
    }
  };

  const getHotelTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'guest_house':
        return 'B&B';
      case 'hostel':
        return 'Hostel';
      case 'motel':
        return 'Motel';
      default:
        return 'Hotel';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hotel e B&B Vicini</Text>
        <Text style={styles.subtitle}>
          Trova alloggi vicino al centro del tuo percorso
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
          onPress={handleSearchHotels}
          disabled={isSearching || !optimizedRoute || optimizedRoute.length === 0}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Search color="#fff" size={20} />
          )}
          <Text style={styles.searchButtonText}>
            {isSearching ? 'Cercando...' : 'Trova Hotel'}
          </Text>
        </TouchableOpacity>
      </View>

      {centroid && (
        <View style={styles.centroidCard}>
          <MapPin color="#2563eb" size={20} />
          <View style={styles.centroidInfo}>
            <Text style={styles.centroidLabel}>Centro Percorso</Text>
            <Text style={styles.centroidCoords}>
              {centroid.lat.toFixed(6)}, {centroid.lon.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.hotelList} showsVerticalScrollIndicator={false}>
        {hotels.length === 0 && !isSearching ? (
          <View style={styles.emptyState}>
            <Building2 color="#9ca3af" size={48} />
            <Text style={styles.emptyText}>Nessun hotel trovato</Text>
            <Text style={styles.emptySubtext}>
              Cerca hotel vicino al tuo percorso ottimizzato
            </Text>
          </View>
        ) : (
          hotels.map((hotel, index) => (
            <View key={index} style={styles.hotelItem}>
              <View style={styles.hotelHeader}>
                <View style={styles.hotelInfo}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <View style={styles.hotelMeta}>
                    <View 
                      style={[
                        styles.hotelType, 
                        { backgroundColor: getHotelTypeColor(hotel.type) }
                      ]}
                    >
                      <Text style={styles.hotelTypeText}>
                        {getHotelTypeLabel(hotel.type)}
                      </Text>
                    </View>
                    <Text style={styles.hotelDistance}>
                      {hotel.distanceFromLastPoint !== undefined 
                        ? `${hotel.distanceFromLastPoint.toFixed(1)} km dall'ultima tappa`
                        : `${hotel.distance.toFixed(1)} km dal centro`
                      }
                    </Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.hotelAddress}>{hotel.address}</Text>
              
              <View style={styles.hotelCoords}>
                <MapPin color="#64748b" size={14} />
                <Text style={styles.hotelCoordsText}>
                  {hotel.lat.toFixed(6)}, {hotel.lon.toFixed(6)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {hotels.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {hotels.length} alloggio{hotels.length !== 1 ? 'i' : ''} trovato{hotels.length !== 1 ? 'i' : ''}
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
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  centroidCard: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centroidInfo: {
    flex: 1,
  },
  centroidLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  centroidCoords: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  hotelList: {
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
  hotelItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hotelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelInfo: {
    flex: 1,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  hotelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hotelType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hotelTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  hotelDistance: {
    fontSize: 12,
    color: '#64748b',
  },
  hotelAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  hotelCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hotelCoordsText: {
    fontSize: 12,
    color: '#64748b',
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