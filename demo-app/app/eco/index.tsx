import { useRouter } from "expo-router";
import { ArrowLeft, Award, Info, Leaf, Recycle, Sprout, TreePine } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getEcoImpactMe, getEcoLeaderboard } from "../../utils/api";

const palette = {
  backgroundFrom: "#E6F6EE",
  backgroundTo: "#F2FBF8",
  headerSurface: "#E3F0E9",
  primaryFrom: "#0BB26E",
  primaryTo: "#0A945D",
  softSurface: "#F5FAF6",
  mintSurface: "#B7E5D1",
  aquaFrom: "#6DD8CF",
  aquaTo: "#45B5A9",
  coralFrom: "#F9B8C4",
  coralTo: "#F58CA0",
  sandFrom: "#FFD97D",
  sandTo: "#FFC94D",
  nearWhite: "#F2F9F6",
  dimText: "#D7EFE5",
  deepGreen: "#0F766E",
};

// Normalize any incoming numeric value; fall back to 0 for undefined/NaN
const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const milestones = [
  { title: "Khởi đầu xanh", icon: "🌱", target: 10 },
  { title: "Chiến binh môi trường", icon: "🌿", target: 25 },
  { title: "Siêu anh hùng xanh", icon: "🌳", target: 50 },
  { title: "Hành tinh tươi đẹp", icon: "🌎", target: 100 },
];

export default function EcoScreen() {
  const router = useRouter();
  const [impact, setImpact] = useState<{ totalCO2?: number; trees?: number; trash?: number; itemsShared?: number }>({});
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const me: any = await getEcoImpactMe();
      const board: any = await getEcoLeaderboard();
      setImpact(me || {});
      const arr = (board?.leaders as any[]) || board?.leaderboard || board || [];
      setLeaders(Array.isArray(arr) ? arr.slice(0, 10) : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải dữ liệu xanh";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const next = useMemo(() => {
    const co2 = impact.totalCO2 ?? 0;
    return milestones.find((m) => m.target > co2);
  }, [impact.totalCO2]);

  const progress = useMemo(() => {
    const co2 = impact.totalCO2 ?? 0;
    return next ? Math.min(100, (co2 / next.target) * 100) : 100;
  }, [impact.totalCO2, next]);

  const co2 = toNumber(impact.totalCO2);
  const trees = toNumber(impact.trees);
  const trash = toNumber(impact.trash);

  return (
    <View className="flex-1 bg-gradient-to-br from-[#E6F6EE] via-[#F2FBF8] to-[#D3F0E5]">
      <View className="flex-row items-center justify-between px-6 py-4" style={{ backgroundColor: `${palette.headerSurface}CC`, borderBottomColor: "#D1E5DA", borderBottomWidth: 1 }}>
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color={palette.deepGreen} />
        </Pressable>
        <Text className="text-lg font-semibold">Tác động xanh</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#7DD3CE"]} />}
      >
        <View style={{ backgroundColor: palette.primaryFrom, borderColor: "#0A8B58" }} className="rounded-3xl p-6 shadow-xl mb-6 border">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${palette.nearWhite}30` }}>
              <Leaf size={24} color={palette.nearWhite} />
            </View>
            <View>
              <Text className="text-lg font-semibold" style={{ color: palette.nearWhite }}>Tổng tác động</Text>
              <Text className="text-sm" style={{ color: palette.dimText }}>Đóng góp môi trường</Text>
            </View>
          </View>
          <View className="grid grid-cols-3 gap-4">
            <View className="items-center">
              <Text className="text-3xl font-bold" style={{ color: palette.nearWhite }}>{trees}</Text>
              <Text className="text-xs" style={{ color: palette.dimText }}>Cây xanh</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold" style={{ color: palette.nearWhite }}>{co2.toFixed(1)}</Text>
              <Text className="text-xs" style={{ color: palette.dimText }}>kg CO₂</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold" style={{ color: palette.nearWhite }}>{trash.toFixed(1)}</Text>
              <Text className="text-xs" style={{ color: palette.dimText }}>kg rác</Text>
            </View>
          </View>
        </View>

        {next && (
          <View className="rounded-2xl p-5 shadow-sm mb-6" style={{ backgroundColor: palette.softSurface }}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Sprout size={18} color={palette.deepGreen} />
                <Text className="font-semibold">Mốc tiếp theo</Text>
              </View>
              <Text className="text-2xl">{next.icon}</Text>
            </View>
            <Text className="text-sm text-gray-600 mb-3">{next.title} ({next.target}kg CO₂)</Text>
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <View
                style={{ width: `${progress}%` }}
                className="h-3 bg-gradient-to-r from-green-400 to-green-600"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-2 text-right">
              {co2.toFixed(1)} / {next.target} kg
            </Text>
          </View>
        )}

        <View className="gap-3 mb-6">
          <View className="p-4 rounded-2xl" style={{ backgroundColor: palette.mintSurface }}>
            <View className="flex-row items-center gap-3">
              <TreePine size={22} color={palette.deepGreen} />
              <View>
                <Text className="font-semibold text-[#0A4F3E]">CO₂ đã giảm</Text>
                <Text className="text-2xl font-bold text-[#083A2D]">{co2.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>
          <View className="p-4 rounded-2xl" style={{ backgroundColor: palette.coralFrom }}>
            <View className="flex-row items-center gap-3">
              <Recycle size={22} color={palette.nearWhite} />
              <View>
                <Text className="font-semibold" style={{ color: palette.nearWhite }}>Rác thải giảm</Text>
                <Text className="text-2xl font-bold" style={{ color: palette.nearWhite }}>{trash.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-3 mb-6">
          <View className="flex-row items-center gap-2">
            <Award size={16} color={palette.deepGreen} />
            <Text className="font-semibold">Mốc thành tích</Text>
          </View>
          <View className="grid grid-cols-2 gap-3">
            {milestones.map((m) => {
              const unlocked = co2 >= m.target;
              return (
                <View
                  key={m.title}
                  className={`p-4 rounded-2xl text-center ${unlocked ? "bg-gradient-to-br from-[#FFD97D] to-[#FFC94D]" : "bg-gray-100"}`}
                >
                  <Text className="text-3xl mb-1">{unlocked ? m.icon : "🔒"}</Text>
                  <Text
                    className={`font-semibold text-sm ${unlocked ? "text-[#0A4F3E]" : "text-gray-500"}`}
                  >
                    {m.title}
                  </Text>
                  <Text className={`text-xs ${unlocked ? "text-[#0A4F3E]/80" : "text-gray-400"}`}>{m.target}kg CO₂</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: palette.softSurface }}>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Award size={16} color={palette.deepGreen} />
              <Text className="font-semibold">Bảng xếp hạng</Text>
            </View>
            <Text className="text-xs text-gray-500">Top 10</Text>
          </View>
          {loading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-gray-200" />
                  <View className="h-3 bg-gray-200 rounded-full flex-1" />
                  <View className="w-14 h-3 bg-gray-200 rounded-full" />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={leaders}
              keyExtractor={(item, idx) => item.id || item.userId || String(idx)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 my-2" />}
              renderItem={({ item, index }) => {
                const itemCO2 = toNumber(item.totalCO2 ?? item.score);
                const itemShared = toNumber(item.itemsShared ?? item.count);
                return (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-[#A8E6E2] items-center justify-center">
                      <Text className="text-xs font-semibold text-[#0F766E]">{index + 1}</Text>
                    </View>
                    <View>
                      <Text className="font-semibold text-sm" numberOfLines={1}>{item.name || item.userName || "Ẩn danh"}</Text>
                      <Text className="text-xs text-gray-500">{itemCO2.toFixed(1)} kg CO₂</Text>
                    </View>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-[#7DD3CE]/20">
                    <Text className="text-xs text-[#0F766E]">{itemShared} món</Text>
                  </View>
                </View>
                );
              }}
            />
          )}
          {error && <Text className="text-xs text-red-500 mt-3">{error}</Text>}
        </View>

        <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: palette.aquaFrom }}>
          <View className="flex-row items-start gap-3">
            <Info size={20} color={palette.nearWhite} />
            <View className="flex-1">
              <Text className="font-semibold" style={{ color: palette.nearWhite }}>Bạn có biết?</Text>
              <Text className="text-sm" style={{ color: palette.nearWhite }}>
                Tái sử dụng một món đồ có thể giúp giảm ~2kg CO₂, tương đương 0.27 cây xanh hấp thụ trong một năm.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
