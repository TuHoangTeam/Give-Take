import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Gift, MapPin, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { getPublicWishlists } from "../../utils/api";

const timeAgo = (value: string) => {
  if (!value) return "Vừa xong";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return "Vừa xong";
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
};

export default function PublicWishlistScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [community, setCommunity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getPublicWishlists({ page: 1, limit: 200 });
      const list = (res as any)?.wishlists || (res as any)?.items || res || [];

      // Normalize data coming from the public API
      const normalized = Array.isArray(list)
        ? list.map((item: any) => ({
            id: item.id || item._id,
            keyword: item.keyword,
            createdAt: item.createdAt,
            maxDistance: item.maxDistance ?? item.distance,
            categoryName: item.category?.name || item.categoryName || item.category,
            categoryColor: item.category?.color,
            user: item.user || {
              name: item.userName || "Ẩn danh",
              location: item.location,
            },
          }))
        : [];

      setCommunity(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return community.filter((w) => {
      const keyword = (w.keyword || "").toLowerCase();
      const name = (w.user?.name || "").toLowerCase();
      return keyword.includes(q) || name.includes(q);
    });
  }, [community, search]);

  const stats = useMemo(() => {
    const users = new Set(filtered.map((w) => w.user?.name || "Ẩn danh"));
    const categories = new Set(filtered.map((w) => w.categoryName).filter(Boolean));
    return {
      wishCount: filtered.length,
      userCount: users.size,
      categoryCount: categories.size,
    };
  }, [filtered]);

  return (
    <View className="flex-1 bg-[#F6FAFB]">
      <View className="bg-white border-b border-[#E5F1EF]">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center bg-[#EAF7F4]">
            <ArrowLeft size={20} color="#0F172A" />
          </Pressable>
          <Text className="text-lg font-semibold text-[#0F172A]">Mong Muốn Của Cộng Đồng</Text>
          <View className="w-10" />
        </View>
        <View className="px-6 pb-4">
          <View className="relative">
            <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: 16, top: 14 }} />
            <TextInput
              placeholder="Tìm kiếm mong muốn..."
              value={search}
              onChangeText={setSearch}
              className="h-12 bg-[#EEF3F6] rounded-full pl-12 pr-4 text-[#0F172A]"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      <ScrollView
        className="px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#2EC9B8"]} />}
      >
        <View className="p-4 bg-[#DFF5F0] border border-[#C7EAE3] rounded-2xl shadow-sm mb-4">
          <View className="flex-row gap-3">
            <View className="w-10 h-10 rounded-full bg-[#2EC9B8] items-center justify-center">
              <Bell size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-sm text-[#0F172A] mb-1">Giúp đỡ cộng đồng</Text>
              <Text className="text-xs text-[#4B5563]">
                Đây là danh sách những gì mọi người đang tìm kiếm. Nếu bạn có món đồ phù hợp, hãy đăng lên để giúp họ!
              </Text>
            </View>
          </View>
        </View>

        {error && <Text className="text-red-500 text-sm mb-3">{error}</Text>}

        {loading ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="bg-white rounded-2xl p-4 shadow-sm flex-row items-start gap-3 opacity-70">
                <View className="w-12 h-12 rounded-full bg-gray-200" />
                <View className="flex-1 gap-2">
                  <View className="h-3.5 bg-gray-200 rounded-full w-2/3" />
                  <View className="h-3 bg-gray-200 rounded-full w-1/2" />
                  <View className="h-3 bg-gray-200 rounded-full w-1/3" />
                </View>
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500">Không tìm thấy wishlist phù hợp.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filtered.map((w) => (
              <View key={w.id || w._id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E6F1EF]">
                <View className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-full bg-[#E6F4F2] items-center justify-center">
                    <Text className="text-[#0F172A] font-semibold">{w.user?.avatar || (w.user?.name || "?").slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="font-semibold text-sm text-[#0F172A]">{w.user?.name || "Ẩn danh"}</Text>
                      <Text className="text-xs text-gray-500">• {timeAgo(w.createdAt)}</Text>
                    </View>
                    <Text className="font-semibold text-base text-[#0F172A] mb-2">Đang tìm: {`"${w.keyword}"`}</Text>
                    <View className="flex-row flex-wrap gap-2 mb-3 items-center">
                      {w.categoryName ? (
                        <View
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${w.categoryColor || "#2EC9B8"}22` }}
                        >
                          <Text className="text-xs" style={{ color: w.categoryColor || "#2EC9B8" }}>
                            {w.categoryName}
                          </Text>
                        </View>
                      ) : null}
                      <View className="flex-row items-center gap-1">
                        <MapPin size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-600">{w.user?.location || "Chưa rõ"}</Text>
                      </View>
                      {w.maxDistance ? (
                        <Text className="text-xs text-gray-600">Bán kính {Math.round(w.maxDistance / 1000)}km</Text>
                      ) : null}
                    </View>
                    <Pressable className="w-full h-11 rounded-full items-center justify-center flex-row gap-2" style={{ backgroundColor: "#2EC9B8" }}>
                      <Gift size={16} color="#fff" />
                      <Text className="text-white font-semibold text-sm">Tôi có món này!</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mt-6 bg-white rounded-2xl shadow-sm border border-[#E6F1EF] px-4 py-3">
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: "#2EC9B8" }}>{stats.wishCount}</Text>
              <Text className="text-xs text-gray-500">Mong muốn</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: "#F06292" }}>{stats.userCount}</Text>
              <Text className="text-xs text-gray-500">Người dùng</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: "#F5A524" }}>{stats.categoryCount}</Text>
              <Text className="text-xs text-gray-500">Danh mục</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
