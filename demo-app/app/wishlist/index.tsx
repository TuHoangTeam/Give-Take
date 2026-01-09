import { useRouter } from "expo-router";
import { ArrowLeft, Bell, MapPin, Plus, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, PanResponder, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { CategoryResponse, createWishlist, deleteWishlist, getCategories, getMyWishlists } from "../../utils/api";

export default function WishlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<{ id: string | number; keyword: string; categoryName?: string; distance?: number; createdAt?: string; maxDistance?: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [distance, setDistance] = useState(5);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(1);

  const minDistance = 1;
  const maxDistance = 10;
  const trackWidthRef = useRef(1);

  const load = async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [cats, myWishlists] = await Promise.all([getCategories(), getMyWishlists()]);
      setCategories(cats || []);
      const list = (myWishlists as any)?.wishlists || myWishlists || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải radar";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryChips = useMemo(() => categories, [categories]);

  const updateDistanceFromX = useCallback(
    (x: number) => {
      if (trackWidthRef.current <= 0) return;
      const ratio = Math.min(Math.max(x / trackWidthRef.current, 0), 1);
      const value = Math.round(minDistance + ratio * (maxDistance - minDistance));
      setDistance(value);
    },
    [maxDistance, minDistance]
  );

  const sliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => updateDistanceFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => updateDistanceFromX(evt.nativeEvent.locationX),
      }),
    [updateDistanceFromX]
  );

  const sliderProgress = Math.min(Math.max((distance - minDistance) / (maxDistance - minDistance), 0), 1);
  const knobLeft = Math.max(0, Math.min(trackWidth - 24, sliderProgress * trackWidth - 12));

  const addWishlist = () => {
    if (!keyword.trim()) return;
    setError(null);
    const payload: any = {
      keyword: keyword.trim(),
      maxDistance: distance * 1000,
    };
    if (categoryId) payload.categoryId = categoryId;
    createWishlist(payload)
      .then(() => load(true))
      .catch((err) => setError(err instanceof Error ? err.message : "Không thể tạo yêu cầu"))
      .finally(() => {
        setKeyword("");
        setCategoryId(null);
        setDistance(5);
        setShowForm(false);
      });
  };

  const removeWishlist = (id: string | number) => {
    deleteWishlist(String(id)).finally(() => load(true));
  };

  return (
    <View className="flex-1 bg-[#ffffff]">
      <View className="flex-row items-center justify-between px-6 py-4 bg-[#ffffff] border-b border-gray-100 shadow-sm">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#111" />
        </Pressable>
        <Text className="text-lg font-semibold">Radar Săn Đồ</Text>
        <Pressable
          onPress={() => setShowForm(true)}
          className="w-10 h-10 rounded-full bg-[#5CCAC0] items-center justify-center shadow-md"
        >
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        className="px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#5CCAC0"]} />}
      >
        <View className="p-4 bg-[#5CCAC0] rounded-2xl shadow-sm mb-4 border border-[#5CCAC0]">
          <View className="flex-row items-start gap-3">
            <View className="w-11 h-11 rounded-full bg-[#5CCAC0] items-center justify-center shadow-sm shadow-[#5CCAC0]/40">
              <Bell size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#0F172A]">Radar tự động</Text>
              <Text className="text-sm text-gray-500">
                Nhận thông báo khi có món khớp với từ khóa và khu vực bạn chọn.
              </Text>
            </View>
          </View>
        </View>

        {error && <Text className="text-red-500 text-sm mb-3">{error}</Text>}

        {loading ? (
          <View className="gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-3 opacity-70">
                <View className="w-12 h-12 rounded-full bg-gray-200" />
                <View className="flex-1 gap-2">
                  <View className="h-3.5 bg-gray-200 rounded-full w-3/4" />
                  <View className="h-3 bg-gray-200 rounded-full w-1/2" />
                </View>
                <View className="w-8 h-8 rounded-full bg-gray-200" />
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="w-24 h-24 rounded-full bg-[#A8E6E2] items-center justify-center mb-3">
              <Search size={36} color="#fff" />
            </View>
            <Text className="font-semibold text-base mb-1">Chưa có yêu cầu</Text>
            <Text className="text-sm text-gray-500 text-center px-8">
              Tạo yêu cầu săn đồ để nhận thông báo khi có món phù hợp.
            </Text>
            <Pressable
              onPress={() => setShowForm(true)}
              className="mt-5 px-6 h-12 rounded-full bg-[#5CCAC0] flex-row items-center gap-2 shadow-md shadow-[#5CCAC0]/40"
            >
              <Plus size={18} color="#fff" />
              <Text className="text-white font-semibold">Tạo yêu cầu đầu tiên</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {items.map((w) => {
              const rawCategory = (w as any).category;
              const categoryText =
                typeof w.categoryName === "string" && w.categoryName
                  ? w.categoryName
                  : typeof rawCategory === "string"
                    ? rawCategory
                    : typeof rawCategory?.name === "string"
                      ? rawCategory.name
                      : typeof rawCategory?.title === "string"
                        ? rawCategory.title
                        : undefined;

              return (
                <View key={w.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-start gap-3">
                    <View className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7DD3CE] to-[#A8E6E2] items-center justify-center">
                      <Search size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-semibold" numberOfLines={1}>{w.keyword}</Text>
                        <Pressable onPress={() => removeWishlist(w.id)} className="w-8 h-8 rounded-full items-center justify-center">
                          <X size={16} color="#9CA3AF" />
                        </Pressable>
                      </View>
                      <View className="flex-row flex-wrap items-center gap-2 mb-1">
                        {categoryText ? (
                          <View className="px-3 py-1 rounded-full bg-[#A8E6E2]/20">
                            <Text className="text-xs text-[#5CBFB8]">{categoryText}</Text>
                          </View>
                        ) : null}
                        <View className="flex-row items-center gap-1">
                          <MapPin size={12} color="#6B7280" />
                          <Text className="text-xs text-gray-500">Bán kính {Math.round((w.distance ?? (w.maxDistance ?? 0) / 1000) || 0)}km</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500">Tạo {new Date(w.createdAt || Date.now()).toLocaleDateString("vi-VN")}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {showForm && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-4">
          <Pressable className="absolute inset-0" onPress={() => setShowForm(false)} />
          <View
            className="bg-white rounded-3xl p-6 w-full"
            style={{ width: "92%", maxWidth: 440 }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-semibold text-[#0F172A]">Tạo yêu cầu săn đồ</Text>
              <Pressable onPress={() => setShowForm(false)} className="w-9 h-9 rounded-full items-center justify-center">
                <X size={18} color="#111" />
              </Pressable>
            </View>

            <Text className="text-sm font-semibold text-[#0F172A] mb-2">Từ khóa tìm kiếm</Text>
            <TextInput
              placeholder="VD: Bàn học, giáo trình C++..."
              value={keyword}
              onChangeText={setKeyword}
              className="h-12 px-4 rounded-xl bg-[#F4F6F8] mb-4 text-sm"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="text-sm font-semibold text-[#0F172A] mb-3">Danh mục</Text>
            {categories.length === 0 && loading ? (
              <ActivityIndicator color="#5CCAC0" />
            ) : (
              <FlatList
                data={categoryChips}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setCategoryId(item.id)}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                      categoryId === item.id
                        ? "bg-[#E7F8F6] border-[#5CCAC0]"
                        : "bg-[#F1F5F9] border-transparent"
                    }`}
                  >
                    <Text className={categoryId === item.id ? "text-[#0F172A] font-semibold" : "text-gray-700"}>{item.name}</Text>
                  </Pressable>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            )}

            <View className="mt-4">
              <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={16} color="#5CCAC0" />
                <Text className="text-sm font-semibold text-[#0F172A]">Bán kính tìm kiếm: {distance}km</Text>
              </View>
              <View
                className="justify-center"
                style={{ height: 36 }}
                onLayout={({ nativeEvent }) => {
                  setTrackWidth(nativeEvent.layout.width);
                  trackWidthRef.current = nativeEvent.layout.width;
                }}
                {...sliderPanResponder.panHandlers}
              >
                <View className="h-2 rounded-full bg-[#E3EBF1]" />
                <View className="absolute left-0 h-2 rounded-full bg-[#5CCAC0]" style={{ width: `${sliderProgress * 100}%` }} />
                <View
                  className="absolute -top-2 w-6 h-6 rounded-full bg-white border border-[#5CCAC0] items-center justify-center shadow-md shadow-[#5CCAC0]/30"
                  style={{ left: knobLeft }}
                  pointerEvents="none"
                >
                  <View className="w-3 h-3 rounded-full bg-[#5CCAC0]" />
                </View>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-gray-500">1km</Text>
                <Text className="text-xs text-gray-500">10km</Text>
              </View>
            </View>

            <Pressable
              onPress={addWishlist}
              className="mt-6 w-full h-12 rounded-full bg-[#5CCAC0] flex-row items-center justify-center gap-2 shadow-lg shadow-[#5CCAC0]/40"
            >
              <Bell size={18} color="#fff" />
              <Text className="text-white font-semibold">Tạo yêu cầu và bật thông báo</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
