import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Heart, Leaf, MapPin, MessageCircle, Package, Share2, Star } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import {
  ItemResponse,
  addFavorite,
  checkPoints,
  createTransaction,
  getItem,
  getItems,
  getPointsBalance,
  removeFavorite,
} from "../../utils/api";

const CATEGORY_STYLE: Record<
  string,
  { color: string; text: string }
> = {
  "29c305e3-aaba-40ae-a971-3c873cec2b30": { color: "#FFE4ED", text: "#E91E63" }, // Mỹ phẩm
  "038bd46a-1562-49ca-8679-0ace0997180f": { color: "#FFF5CC", text: "#D4A200" }, // Sách vở
  "ffa9c3f6-aa55-483b-8152-a7accc138447": { color: "#E9FFE9", text: "#1F9A3D" }, // Thời trang
  "fe4526a5-c1fa-4044-9f7a-d6de4096c5a5": { color: "#E3ECFF", text: "#3357FF" }, // Đồ gia dụng
  "c5d5b25d-4698-4a36-9e97-7e5298742b69": { color: "#FFE4DC", text: "#FF5733" }, // Đồ điện tử
};

export default function ItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<ItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [similarItems, setSimilarItems] = useState<ItemResponse[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [fetchedItem, balance] = await Promise.all([getItem(String(id)), getPointsBalance()]);
        if (!mounted) return;
        setItem(fetchedItem);
        setFavorite(Boolean((fetchedItem as any)?.isFavorited));
        const balanceValue = typeof balance === "number"
          ? balance
          : (balance as any)?.balance ?? (balance as any)?.gPoints ?? (balance as any)?.points ?? null;
        setPoints(Number.isFinite(balanceValue as number) ? Number(balanceValue) : null);

        // Load similar items with same category
        if (fetchedItem?.category?.id) {
          try {
            const similarRes = await getItems({
              category: fetchedItem.category.id,
              limit: 12,
              status: "AVAILABLE",
            });
            const similar = (similarRes?.items || []).filter((i: ItemResponse) => i.id !== id);
            setSimilarItems(similar.slice(0, 3));
          } catch (err) {
            console.error("Failed to load similar items:", err);
          }
        }
      } catch (err: any) {
        Alert.alert("Không thể tải dữ liệu", err?.message || "Lỗi không xác định");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const cover = item?.images?.[0];
  const badgeColor = (item?.type || "").toLowerCase() === "cho tặng" ? "#7DD3CE" : "#FFB6C1";
  const location = item?.location || "Đang cập nhật";
  const postedAt = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
  const co2 = item?.estimatedCO2 ?? 0;
  const ownerName = item?.owner?.name || "Người dùng";
  const ownerAvatar = ownerName ? ownerName.charAt(0).toUpperCase() : "?";
  const ownerRating = item?.owner?.rating ?? 0;

  const categoryStyle = useMemo(() => {
    const id = item?.category?.id;
    return id && CATEGORY_STYLE[id] ? CATEGORY_STYLE[id] : { color: "#E5F7F6", text: "#5CBFB8" };
  }, [item?.category?.id]);

  const conditionStyle = useMemo(() => ({
    bg: "#FFE8B3",
    text: "#D97706",
  }), []);

  const typeLabel = (type?: string) => {
    if (!type) return "Đồ trao đổi";
    return type === "give" ? "Cho tặng" : type === "request" ? "Xin nhận" : type;
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        title: item.title,
        message: `${item.title} - Xem ngay trên Give & Take` + (item.id ? `\n${item.id}` : ""),
      });
    } catch {
      // ignore
    }
  };

  const toggleFavorite = async () => {
    if (!item) return;
    try {
      setFavorite((prev) => !prev);
      if (!favorite) {
        await addFavorite(item.id);
      } else {
        await removeFavorite(item.id);
      }
    } catch (err: any) {
      setFavorite((prev) => !prev);
      Alert.alert("Không thể cập nhật yêu thích", err?.message || "Có lỗi xảy ra");
    }
  };

  const handleRequest = async () => {
    if (!item || !id) return;
    const requiredPointsAmount = 5;

    try {
      setSubmitting(true);

      const check = await checkPoints(requiredPointsAmount);
      const hasEnough = typeof check === "boolean"
        ? check
        : Boolean((check as any)?.hasEnough ?? (check as any)?.sufficient ?? (check as any)?.enough ?? ((check as any)?.balance ?? 0) >= requiredPointsAmount);

      if (!hasEnough) {
        const balance = (check as any)?.balance ?? points ?? 0;
        Alert.alert("Không đủ điểm", `Bạn cần ${requiredPointsAmount} G-Point để gửi yêu cầu. Hiện tại bạn có ${balance} G-Point.`);
        return;
      }

      const meetingPayload = {
        itemId: String(id),
        meetingLocation: item.location || undefined,
        meetingTime: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      };

      const transactionRes: any = await createTransaction(meetingPayload);
      const transactionId = transactionRes?.id || transactionRes?.transaction?.id;

      const nextBalance = (check as any)?.balance ?? (check as any)?.gPoints ?? (check as any)?.points;
      if (Number.isFinite(nextBalance)) setPoints(Number(nextBalance));

      router.push({
        pathname: "/chat",
        params: {
          itemId: id,
          transactionId,
          ownerId: item.owner?.id,
        },
      });
    } catch (err: any) {
      Alert.alert("Không thể gửi yêu cầu", err?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7DD3CE" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-gray-600 mb-4">Không tìm thấy món này.</Text>
        <Pressable className="px-4 py-2 rounded-full bg-[#7DD3CE]" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white/90 border-b">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow items-center justify-center">
          <ArrowLeft size={20} color="#111" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable className="w-10 h-10 rounded-full bg-white shadow items-center justify-center" onPress={handleShare}>
            <Share2 size={18} color="#111" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-white shadow items-center justify-center" onPress={toggleFavorite}>
            <Heart size={18} color={favorite ? "#F472B6" : "#111"} fill={favorite ? "#F472B6" : "none"} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="relative bg-gray-100">
          {cover ? (
            <Image source={{ uri: cover }} className="w-full h-80" resizeMode="cover" />
          ) : (
            <View className="w-full h-80 items-center justify-center bg-gray-200">
              <Text className="text-gray-500">Chưa có ảnh</Text>
            </View>
          )}
          <View className="absolute top-4 left-4 px-3 py-1 rounded-full" style={{ backgroundColor: badgeColor }}>
            <Text className="text-white font-semibold">{typeLabel(item.type)}</Text>
          </View>
          <View className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 flex-row items-center gap-1">
            <Leaf size={14} color="#fff" />
            <Text className="text-white text-xs">{co2}kg CO₂</Text>
          </View>
        </View>

        <View className="px-6 py-4 border-b">
          <Text className="text-2xl font-bold mb-2">{item.title}</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: categoryStyle.color }}>
              <Text className="text-xs" style={{ color: categoryStyle.text }}>
                {item.category?.name || "Danh mục"}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: conditionStyle.bg }}>
              <Text className="text-xs" style={{ color: conditionStyle.text }}>
                {item.condition || "Tình trạng"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} color="#7DD3CE" />
            <Text>{location}</Text>
          </View>
          <View className="flex-row items-center gap-2 text-sm text-gray-600 mt-1">
            <Calendar size={16} color="#F472B6" />
            <Text>Đăng {postedAt}</Text>
          </View>
        </View>

        <View className="px-6 py-4 border-b">
          <Text className="font-semibold mb-2 flex-row items-center gap-2">Tác động môi trường</Text>
          <View className="bg-green-50 rounded-2xl p-4">
            <Text className="text-2xl font-bold text-green-700">{co2} kg CO₂</Text>
            <Text className="text-sm text-green-700">≈ {(co2 / 7.5).toFixed(2)} cây xanh</Text>
          </View>
        </View>

        <View className="px-6 py-4 border-b">
          <Text className="font-semibold mb-2">Mô tả</Text>
          <Text className="text-sm text-gray-700 leading-relaxed">{item.description || "Chưa có mô tả"}</Text>
        </View>

        <View className="px-6 py-4">
          <Text className="font-semibold mb-3">Người đăng</Text>
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full border border-[#7DD3CE] items-center justify-center">
              <Text className="text-[#FF9BAA] font-semibold">{ownerAvatar}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{ownerName}</Text>
                <View className="flex-row items-center gap-1">
                  <Star size={14} color="#FACC15" fill="#FACC15" />
                  <Text className="text-xs text-gray-600">{ownerRating.toFixed(1)}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">{item.views ?? 0} lượt xem</Text>
            </View>
            <Pressable
              className="px-3 py-1 rounded-full border border-[#7DD3CE]"
              onPress={() =>
                item.owner?.id &&
                router.push({ pathname: "/user/[id]", params: { id: String(item.owner.id) } } as any)
              }
            >
              <Text className="text-xs text-[#7DD3CE] font-semibold">Xem trang</Text>
            </Pressable>
          </View>
        </View>

        {/* Similar Items Section */}
        <View className="px-6 py-4 border-t">
          <Text className="font-semibold mb-3">Đồ tương tự</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
            {(similarItems.length ? similarItems : Array.from({ length: 3 }).map((_, i) => ({
              id: `placeholder-${i}`,
              title: `Sản phẩm ${i + 1}`,
              location: "Cho tặng",
              type: "give" as const,
              images: [],
              placeholder: true,
            })) ).slice(0, 3).map((simItem: any) => (
              <Pressable
                key={simItem.id}
                onPress={() => simItem.placeholder ? undefined : router.push({ pathname: "/item", params: { id: simItem.id } })}
                className="w-40 mx-2 bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {simItem.images?.[0] ? (
                  <Image source={{ uri: simItem.images[0] }} className="w-full h-32" resizeMode="cover" />
                ) : (
                  <View className="w-full h-32 bg-gray-100 items-center justify-center">
                    <Package size={32} color="#9CA3AF" />
                  </View>
                )}
                <View className="p-3">
                  <Text className="font-semibold text-sm mb-1" numberOfLines={1}>
                    {simItem.title}
                  </Text>
                  <View className="flex-row items-center gap-1 mb-1">
                    <MapPin size={12} color="#7DD3CE" />
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                      {simItem.location || "Cho tặng"}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: simItem.type === "give" ? "#7DD3CE" : "#FFB6C1" }}
                    >
                      <Text className="text-white text-xs">{typeLabel(simItem.type)}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-600">Cần 5 G-Point để xin</Text>
          <Text className="text-sm font-semibold">Bạn có: {points ?? "-"} G-Point</Text>
        </View>
        <Pressable
          disabled={submitting}
          onPress={handleRequest}
          className="rounded-full overflow-hidden shadow-lg" // Thêm overflow-hidden để bo tròn gradient
        >
            {/* Logic: Nếu submitting thì màu xám, nếu không thì hiện Gradient */}
            {submitting ? (
                <View className="h-14 bg-gray-300 items-center justify-center flex-row gap-2">
                    <MessageCircle size={18} color="#7DD3CE" />
                    <Text className="text-white font-semibold">Đang gửi...</Text>
                </View>
            ) : (
                <LinearGradient
                    colors={['#6FD0C5', '#F4B6C6']} // Màu from-[#6FD0C5] to-[#F4B6C6]
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }} // Tương ứng với to-r (Right)
                    className="h-14 items-center justify-center flex-row gap-2"
                >
                    <MessageCircle size={18} color="#fff" /> 
                    {/* Đổi màu icon sang trắng cho nổi trên nền gradient */}
                    <Text className="text-white font-semibold">Tôi muốn xin (5 G-Point)</Text>
                </LinearGradient>
            )}
        </Pressable>
      </View>
    </View>
  );
}
