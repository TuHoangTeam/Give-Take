import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { ItemResponse, getItems } from "../../utils/api";

const fallbackImage = "https://via.placeholder.com/900?text=Give+%26+Take";

const typeLabel = (type?: string) => {
  if (type === "EXCHANGE") return "Trao đổi";
  return "Cho tặng";
};

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getItems({ search: query.trim() || undefined, limit: 30 });
      setItems(res.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải kết quả";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const renderCard = ({ item }: { item: ItemResponse }) => {
    const cover = item.images?.[0] || fallbackImage;
    const location = item.location || "Chưa rõ vị trí";
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/item", params: { id: item.id } })}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
      >
        <Image source={{ uri: cover }} className="w-full aspect-square" resizeMode="cover" />
        <View className="p-3 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-white px-3 py-1 rounded-full" style={{ backgroundColor: item.type === "EXCHANGE" ? "#FFB6C1" : "#7DD3CE" }}>
              {typeLabel(item.type)}
            </Text>
            <Text className="text-xs text-gray-500">{item.owner?.name || "Ẩn danh"}</Text>
          </View>
          <Text className="font-semibold text-sm text-gray-900" numberOfLines={2}>{item.title}</Text>
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#6B7280" />
            <Text className="text-xs text-gray-500" numberOfLines={1}>{location}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSkeleton = (i: number) => (
    <View
      key={`skeleton-${i}`}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, opacity: 0.6 }}
    >
      <View className="w-full aspect-square bg-gray-200" />
      <View className="p-3 gap-2">
        <View className="h-4 bg-gray-200 rounded-full w-1/3" />
        <View className="h-4 bg-gray-200 rounded-full w-4/5" />
        <View className="h-3 bg-gray-200 rounded-full w-1/2" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between w-full px-6 py-4 bg-white border-b">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#111" />
        </Pressable>
        <Text className="text-lg font-semibold">Tìm kiếm</Text>
        <View className="w-10" />
      </View>

      <View className="px-6 pt-4 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Nhập từ khoá..."
            value={query}
            onChangeText={setQuery}
            className="flex-1 ml-3"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
        </View>
        {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}
      </View>

      <FlatList
        data={loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}` } as any)) : items}
        keyExtractor={(item, idx) => (item.id as string) || String(idx)}
        renderItem={({ item, index }) => (item.id ? renderCard({ item }) : renderSkeleton(index))}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 12, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 140, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} colors={["#7DD3CE"]} />}
        ListEmptyComponent={!loading ? (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-500">Không tìm thấy kết quả.</Text>
          </View>
        ) : null}
      />
    </View>
  );
}
