import { useRouter } from "expo-router";
import { ArrowLeft, Award, Gift, Heart, Leaf, Mail, MapPin, Phone, Settings, Star, TrendingUp, Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getAchievements, getEcoImpactMe, getFavorites, getMe, getMyAchievements, getMyItemsAll, getUserRatings, getUserStats } from "../../utils/api";

const profilePalette = {
  mint: "#A5E5D6",
  mintDeep: "#4DBEA8",
  coral: "#FFB6C1",
  lemon: "#FFD97D",
  amber: "#F5BF38",
  green: "#2EB872",
  badge: "#6BD9C3",
  card: "#F7F9FB",
  text: "#0F172A",
  subtext: "#6B7280",
};

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("...");
  const [profileLocation, setProfileLocation] = useState("Đang cập nhật");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [gPoints, setGPoints] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ given: 0, received: 0, rating: 0, reviews: 0, co2: 0 });
  const [achievementCount, setAchievementCount] = useState(0);
  const [achievements, setAchievements] = useState<{ id: string | number; title: string; color?: string; unlocked?: boolean }[]>([]);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [tab, setTab] = useState<"items" | "achievements" | "ratings" | "favorites">("items");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      const userId = (me as any)?.id;
      setUserId(userId || null);
      setUserName(me?.name || "Bạn");
      setProfileLocation(me?.location || "Đang cập nhật");
      setEmail((me as any)?.email || null);
      setPhone((me as any)?.phone || null);
      setAvatar((me as any)?.avatar || null);
      const nextPoints = Number((me as any)?.gPoints ?? 0);
      setGPoints(Number.isFinite(nextPoints) ? nextPoints : 0);

      if (userId) {
        const [statsRes, ratingsRes] = await Promise.all([
          getUserStats(userId),
          getUserRatings(userId),
        ]);
        const ratingValue = Array.isArray((ratingsRes as any)?.ratings)
          ? (ratingsRes as any).ratings.reduce((acc: number, r: any) => acc + (r?.rating || 0), 0) /
            Math.max((ratingsRes as any).ratings.length, 1)
          : (ratingsRes as any)?.rating ?? 0;
        setStats({
          given: (statsRes as any)?.given ?? (statsRes as any)?.totalGiven ?? 0,
          received: (statsRes as any)?.received ?? (statsRes as any)?.totalReceived ?? 0,
          rating: Number.isFinite(ratingValue) ? Number(ratingValue.toFixed(1)) : 0,
          reviews: Array.isArray((ratingsRes as any)?.ratings) ? (ratingsRes as any).ratings.length : (ratingsRes as any)?.reviews ?? 0,
          co2: (statsRes as any)?.co2 ?? (statsRes as any)?.totalCO2 ?? 0,
        });
      }

      const [achRes, myAchRes, ecoRes, itemsRes, ratingsListRes, favoritesRes] = await Promise.allSettled([
        getAchievements(),
        getMyAchievements(),
        getEcoImpactMe(),
        getMyItemsAll({ status: "PENDING" }),
        userId ? getUserRatings(userId, { limit: 10 }) : Promise.resolve([]),
        getFavorites({ limit: 20 }),
      ]);

      if (ecoRes.status === "fulfilled") {
        setStats((prev) => ({ ...prev, co2: (ecoRes.value as any)?.totalCO2Saved ?? (ecoRes.value as any)?.totalCO2 ?? prev.co2 }));
      }

      if (itemsRes.status === "fulfilled") {
        const list = (itemsRes.value as any) || [];
        setMyItems(Array.isArray(list) ? list : []);
      }

      if (ratingsListRes.status === "fulfilled") {
        const list = (ratingsListRes.value as any)?.ratings || ratingsListRes.value || [];
        setRatings(Array.isArray(list) ? list.slice(0, 10) : []);
      }

      if (favoritesRes.status === "fulfilled") {
        const list = (favoritesRes.value as any)?.items || favoritesRes.value || [];
        setFavorites(Array.isArray(list) ? list : []);
      }

      const mergedAchievements = (myAchRes.status === "fulfilled" ? (myAchRes.value as any) : achRes.status === "fulfilled" ? (achRes.value as any) : []) || [];
      const colored = Array.isArray(mergedAchievements)
        ? mergedAchievements.map((a, idx) => ({
            id: a.id ?? idx,
            title: a.title ?? a.name ?? "Thành tựu",
            unlocked: a.unlocked ?? true,
            color: ["#7DD3CE", "#FFB6C1", "#FFD97D", "#A8E6E2"][idx % 4],
          }))
        : [];
      setAchievements(colored);
      setAchievementCount(colored.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải hồ sơ";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: profilePalette.card }}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color={profilePalette.text} />
        </Pressable>
        <Text className="text-lg font-semibold">Trang cá nhân</Text>
        <Pressable onPress={() => router.push("/settings")} className="w-10 h-10 rounded-full items-center justify-center">
          <Settings size={20} color={profilePalette.text} />
        </Pressable>
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
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-2xl font-bold text-white">{userName.charAt(0)}</Text>}
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
              <Pressable
                onPress={() => router.push("/edit-profile")}
                className="px-3 py-2 rounded-full mt-6"
                style={{ borderColor: profilePalette.mintDeep, borderWidth: 1 }}
              >
                <Text className="text-xs font-semibold" style={{ color: profilePalette.mintDeep }}>Sửa</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between mt-4">
              {[{
                label: "Đã cho",
                value: stats.given,
                icon: <Gift size={20} color="#2CA6A4" />,
                tint: "#D5F2ED",
              }, {
                label: "Đã nhận",
                value: stats.received,
                icon: <Heart size={20} color="#F59EAF" />,
                tint: "#FDE7ED",
              }, {
                label: "Thành tựu",
                value: achievementCount,
                icon: <Award size={20} color="#F5BF38" />,
                tint: "#FFF2D8",
              }, {
                label: "kg CO₂",
                value: stats.co2.toFixed(1),
                icon: <Leaf size={20} color="#34C759" />,
                tint: "#E6F7EC",
                onPress: () => router.push("/eco"),
              }].map((card) => {
                const Wrapper: any = card.onPress ? Pressable : View;
                return (
                  <Wrapper
                    key={card.label}
                    className="items-center px-3 py-2 rounded-2xl"
                    style={{ backgroundColor: card.tint, minWidth: 70 }}
                    {...(card.onPress ? { onPress: card.onPress } : {})}
                  >
                    {card.icon}
                    <Text className="text-lg font-bold mt-1">{card.value}</Text>
                    <Text className="text-xs text-gray-600">{card.label}</Text>
                  </Wrapper>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/points")}
            className="rounded-3xl p-5 shadow-sm"
            style={{ backgroundColor: "#FFE7A3", borderColor: "#FBCB7F", borderWidth: 1 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: "#FFF3CF" }}>
                  <Wallet size={22} color="#D88B00" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-[#7D5A00]">G-Point của bạn</Text>
                  <Text className="text-3xl font-bold text-[#D88B00]">{gPoints}</Text>
                </View>
              </View>
              <TrendingUp size={20} color="#D88B00" />
            </View>
          </Pressable>

          <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-3">
              <Mail size={16} color={profilePalette.subtext} />
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
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row bg-gray-100 rounded-full p-1">
                {[{ key: "items", label: "Món đồ" }, { key: "achievements", label: "Thành tựu" }, { key: "ratings", label: "Đánh giá" }, { key: "favorites", label: "Đã thích" }].map((t) => {
                  const active = tab === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setTab(t.key as any)}
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: active ? "#fff" : undefined }}
                    >
                      <Text className={`text-sm font-semibold ${active ? "text-[#0F172A]" : "text-gray-500"}`}>{t.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {tab === "items" && (
              <View className="gap-3">
                {loading && myItems.length === 0 ? (
                  <View className="gap-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <View key={i} className="p-3 rounded-2xl bg-gray-100 flex-row items-center gap-3 opacity-70">
                        <View className="w-14 h-14 rounded-2xl bg-gray-200" />
                        <View className="flex-1 gap-2">
                          <View className="h-3 bg-gray-200 rounded-full w-2/3" />
                          <View className="h-3 bg-gray-200 rounded-full w-1/3" />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : myItems.length === 0 ? (
                  <Text className="text-sm text-gray-500">Chưa có món đồ.</Text>
                ) : (
                  myItems.map((item) => (
                    <View key={item.id} className="p-3 rounded-2xl bg-[#F8FAFB] flex-row gap-3 border border-gray-100">
                      <Image source={{ uri: item.images?.[0] }} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
                      <View className="flex-1 gap-1">
                        <Text className="font-semibold" numberOfLines={1}>{item.title}</Text>
                        <Text className="text-xs text-gray-500" numberOfLines={1}>{item.category?.name || ""} • {item.location || ""}</Text>
                        <Text className="text-xs text-gray-500">Trạng thái: {item.status}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {tab === "achievements" && (
              <View className="gap-3">
                {loading && achievements.length === 0 ? (
                  <View className="gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <View key={i} className="p-3 rounded-2xl bg-gray-100 flex-row items-center gap-3 opacity-70">
                        <View className="w-10 h-10 rounded-full bg-gray-200" />
                        <View className="flex-1 gap-2">
                          <View className="h-3 bg-gray-200 rounded-full w-2/3" />
                          <View className="h-3 bg-gray-200 rounded-full w-1/3" />
                        </View>
                        <View className="w-6 h-6 rounded-full bg-gray-200" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="gap-3">
                    {achievements.map((a) => (
                      <View key={a.id} className="p-3 rounded-2xl flex-row items-center gap-3" style={{ backgroundColor: (a.color || "#7DD3CE") + "33" }}>
                        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: (a.color || "#7DD3CE") + "55" }}>
                          <Award size={18} color={a.color || "#7DD3CE"} />
                        </View>
                        <Text className="font-semibold flex-1" numberOfLines={1}>{a.title}</Text>
                        <Award size={18} color={a.color || "#7DD3CE"} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {tab === "ratings" && (
              <View className="gap-3">
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
                  ratings.map((r, idx) => (
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
                  ))
                )}
              </View>
            )}
            {tab === "favorites" && (
              <View className="gap-3">
                {loading && favorites.length === 0 ? (
                  <View className="gap-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <View key={i} className="p-3 rounded-2xl bg-gray-100 flex-row items-center gap-3 opacity-70">
                        <View className="w-14 h-14 rounded-2xl bg-gray-200" />
                        <View className="flex-1 gap-2">
                          <View className="h-3 bg-gray-200 rounded-full w-2/3" />
                          <View className="h-3 bg-gray-200 rounded-full w-1/3" />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : favorites.length === 0 ? (
                  <Text className="text-sm text-gray-500">Chưa có món yêu thích.</Text>
                ) : (
                  favorites.map((item) => (
                    <Pressable
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#F8FAFB] flex-row gap-3 border border-gray-100"
                      onPress={() => router.push({ pathname: "/item", params: { id: item.id } })}
                    >
                      <Image source={{ uri: item.images?.[0] }} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
                      <View className="flex-1 gap-1">
                        <Text className="font-semibold" numberOfLines={1}>{item.title}</Text>
                        <Text className="text-xs text-gray-500" numberOfLines={1}>{item.category?.name || ""} • {item.location || ""}</Text>
                        <Text className="text-xs text-gray-500">Trạng thái: {item.status}</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t px-6 py-4">
        <Pressable
          onPress={() => router.push("/wishlist")}
          className="h-12 rounded-full bg-gradient-to-r from-[#7DD3CE] to-[#5CBFB8] items-center justify-center"
        >
          <Text className="text-white font-semibold">Radar săn đồ</Text>
        </Pressable>
      </View>
    </View>
  );
}
