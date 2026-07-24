import { useTheme } from '@/theme/ThemeContext';
import { formatPrice } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Product {
  id: string;
  title: string;
  seller: string;
  priceCents: number;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRODUCTS: Product[] = [
  { id: 'p1', title: 'React Native Mastery', seller: 'Skill Shop', priceCents: 4900, category: 'Course', icon: 'logo-react' },
  { id: 'p2', title: 'UI/UX Design Kit', seller: 'Amina Hassan', priceCents: 2900, category: 'Template', icon: 'color-palette' },
  { id: 'p3', title: 'Channel Pro Subscription', seller: 'Teleprompt', priceCents: 999, category: 'Subscription', icon: 'star' },
  { id: 'p4', title: 'Voice Pack: Podcast SFX', seller: 'AudioLab', priceCents: 1500, category: 'Audio', icon: 'musical-notes' },
];

export default function Marketplace() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Marketplace</Text>
        <Ionicons name="cart-outline" size={24} color={colors.text} />
      </View>

      <FlatList
        data={PRODUCTS}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ gap: spacing.md, paddingTop: 8, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <View style={[styles.thumb, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name={item.icon} size={40} color={colors.primary} />
            </View>
            <Text style={[styles.category, { color: colors.primary }]}>{item.category}</Text>
            <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.seller, { color: colors.textMuted }]}>{item.seller}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.price, { color: colors.text }]}>{formatPrice(item.priceCents)}</Text>
              <Pressable style={[styles.buy, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
                <Text style={[styles.buyText, { color: colors.onPrimary }]}>Buy</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { flex: 1, padding: 12 },
  thumb: { height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  category: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginTop: 2, minHeight: 38 },
  seller: { fontSize: 12, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 15, fontWeight: '800' },
  buy: { paddingHorizontal: 14, paddingVertical: 6 },
  buyText: { fontWeight: '700', fontSize: 13 },
});
