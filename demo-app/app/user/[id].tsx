import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, Leaf, Mail, MapPin, Phone, Star, TrendingUp } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getUser, getUserRatings, getUserStats } from "../../utils/api";

const profilePalette = {
  mint: "#A5E5D6",
  mintDeep: "#4DBEA8",
  coral: "#FFB6C1",
  lemon: "#FFD97D",
  badge: "#6BD9C3",
  card: "#F7F9FB",
  text: "#0F172A",
  subtext: "#6B7280",
};

export default function UserPublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = params.id as string | undefined;

  const [userName, setUserName] = useState<string>("...");
  const [profileLocation, setProfileLocation] = useState<string>("Đang cập nhật");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [stats, setStats] = useState({ given: 0, received: 0, rating: 0, reviews: 0, co2: 0 });
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => (userName || "?").slice(0, 2).toUpperCase(), [userName]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [user, statsRes, ratingsRes] = await Promise.all([
          getUser(userId),
          getUserStats(userId),
          getUserRatings(userId, { limit: 5 }),
        ]);

        setUserName((user as any)?.name || "Người dùng");
        setProfileLocation((user as any)?.location || "Đang cập nhật");
        setEmail((user as any)?.email || null);
        setPhone((user as any)?.phone || null);
        setAvatar((user as any)?.avatar || null);

        const ratingsList = Array.isArray((ratingsRes as any)?.ratings)
          ? (ratingsRes as any).ratings
          : Array.isArray(ratingsRes)
          ? ratingsRes
          : [];
        setRatings(ratingsList);

        const ratingValue = ratingsList.length
          ? ratingsList.reduce((acc: number, r: any) => acc + (r?.rating || 0), 0) / ratingsList.length
          : (ratingsRes as any)?.rating ?? 0;

        setStats({
          given: (statsRes as any)?.given ?? (statsRes as any)?.totalGiven ?? 0,
          received: (statsRes as any)?.received ?? (statsRes as any)?.totalReceived ?? 0,
          rating: Number.isFinite(ratingValue) ? Number(ratingValue.toFixed(1)) : 0,
          reviews: ratingsList.length || (ratingsRes as any)?.reviews || 0,
          co2: (statsRes as any)?.co2 ?? (statsRes as any)?.totalCO2 ?? 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải thông tin người dùng";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View className="flex-1" style={{ backgroundColor: profilePalette.card }}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color={profilePalette.text} />
        </Pressable>
        <Text className="text-lg font-semibold">Thông tin người đăng</Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#7DD3CE"]} />}
      >
        <View className="px-6 pt-5 gap-4">
          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          <View className="bg-white rounded-3xl p-5 shadow-sm" style={{ borderColor: "#E5E7EB", borderWidth: 1 }}>
            <View className="flex-row items-start gap-4">
              <View className="w-16 h-16 rounded-full overflow-hidden" style={{ backgroundColor: profilePalette.mint }}>
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center" style={{ backgroundColor: profilePalette.coral }}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-2xl font-bold text-white">{initials}</Text>}
                  </View>
                )}
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold" numberOfLines={1}>{userName}</Text>
                  <View className="px-2 py-1 rounded-full" style={{ backgroundColor: profilePalette.badge }}>
                    <Text className="text-xs font-semibold text-white">Đã xác thực</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Star size={16} color="#FACC15" fill="#FACC15" />
                  <Text className="font-semibold">{stats.rating.toFixed(1)}</Text>
                  <Text className="text-sm text-gray-500">({stats.reviews} đánh giá)</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color={profilePalette.subtext} />
                  <Text className="text-sm text-gray-600" numberOfLines={1}>{profileLocation}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between mt-4">
              {[{
                label: "Đã cho",
                value: stats.given,
                icon: <Heart size={20} color="#2CA6A4" />,
                tint: "#D5F2ED",
              }, {
                label: "Đã nhận",
                value: stats.received,
                icon: <TrendingUp size={20} color="#F59EAF" />,
                tint: "#FDE7ED",
              }, {
                label: "kg CO₂",
                value: stats.co2.toFixed(1),
                icon: <Leaf size={20} color="#34C759" />,
                tint: "#E6F7EC",
              }].map((card) => (
                <View key={card.label} className="items-center px-3 py-2 rounded-2xl" style={{ backgroundColor: card.tint, minWidth: 70 }}>
                  {card.icon}
                  <Text className="text-lg font-bold mt-1">{card.value}</Text>
                  <Text className="text-xs text-gray-600">{card.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-3">
              <MapPin size={16} color={profilePalette.subtext} />
              <Text className="font-semibold">Liên hệ</Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Mail size={18} color={profilePalette.mintDeep} />
                <Text className="text-sm text-gray-700">{email || "Đang cập nhật"}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Phone size={18} color={profilePalette.mintDeep} />
                <Text className="text-sm text-gray-700">{phone || "Đang cập nhật"}</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold">Đánh giá gần đây</Text>
              <Text className="text-xs text-gray-500">{stats.reviews} đánh giá</Text>
            </View>
            {loading && ratings.length === 0 ? (
              <View className="gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <View key={i} className="p-3 rounded-2xl bg-gray-100 flex-row items-center gap-3 opacity-70">
                    <View className="w-10 h-10 rounded-full bg-gray-200" />
                    <View className="flex-1 gap-2">
                      <View className="h-3 bg-gray-200 rounded-full w-2/3" />
                      <View className="h-3 bg-gray-200 rounded-full w-1/3" />
                    </View>
                  </View>
                ))}
              </View>
            ) : ratings.length === 0 ? (
              <Text className="text-sm text-gray-500">Chưa có đánh giá.</Text>
            ) : (
              <View className="gap-3">
                {ratings.map((r, idx) => (
                  <View key={idx} className="p-3 rounded-2xl bg-[#F8FAFB] flex-row gap-3 border border-gray-100">
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "#E5E7EB" }}>
                      <Text className="font-semibold text-[#0F172A]" numberOfLines={1}>{(r.reviewerName || r.userName || "Ẩn danh").slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-semibold" numberOfLines={1}>{r.reviewerName || r.userName || "Ẩn danh"}</Text>
                        <Text className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : ""}</Text>
                      </View>
                      <View className="flex-row items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} color={i < (r.rating || 0) ? "#FACC15" : "#E5E7EB"} fill={i < (r.rating || 0) ? "#FACC15" : "none"} />
                        ))}
                      </View>
                      <Text className="text-sm text-gray-700">{r.comment || "Không có nội dung."}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
