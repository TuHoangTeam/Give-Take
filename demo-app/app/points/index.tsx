import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, Coins, RefreshCw, TrendingDown, TrendingUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getPointsBalance, getPointsHistory } from "../../utils/api";

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

export default function PointsScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string | number; description: string; amount: number; date?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        getPointsBalance(),
        getPointsHistory({ limit: 50 }),
      ]);

      const nextBalance = typeof balanceRes === "number"
        ? balanceRes
        : (balanceRes as any)?.balance ?? (balanceRes as any)?.gPoints ?? 0;
      setBalance(Number.isFinite(nextBalance) ? nextBalance : 0);
      setRank((balanceRes as any)?.rank ?? null);

      const list = (historyRes as any)?.items || historyRes || [];
      setHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải G-Point";
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
    <View className="flex-1 bg-[#F7F7F9]">
      <View className="bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
            <ArrowLeft size={20} color="#111" />
          </Pressable>
          <Text className="text-lg font-semibold">Lịch sử G-Point</Text>
          <View className="w-10" />
        </View>

        <View className="mx-6 mb-4 rounded-3xl overflow-hidden shadow" style={{ backgroundColor: "#FFD76F" }}>
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-white/80 text-sm">Số dư hiện tại</Text>
                {loading && balance === null ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-4xl font-bold text-white mt-1">{balance ?? 0}</Text>
                )}
                <Text className="text-white/80 text-sm">G-Point</Text>
              </View>
              <View className="items-end gap-2">
                {rank && (
                  <View className="px-3 py-1 rounded-full bg-white/20">
                    <Text className="text-white font-semibold text-xs">{rank}</Text>
                  </View>
                )}
                <View className="w-10 h-10 rounded-full bg-white/25 items-center justify-center">
                  <Coins size={22} color="#fff" />
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-white" />
                <Text className="text-white/80 text-xs">Cập nhật tự động</Text>
              </View>
              <Pressable onPress={() => load(true)} className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-white/20">
                <RefreshCw size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold">Làm mới</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#7DD3CE"]} />}
      >
        <View className="flex-row items-center gap-2 mb-3">
          <Calendar size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600">Lịch sử giao dịch</Text>
        </View>
        {error && <Text className="text-red-500 text-sm mb-3">{error}</Text>}

        {loading ? (
          <View className="gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-3 opacity-70">
                <View className="w-10 h-10 rounded-full bg-gray-200" />
                <View className="flex-1 gap-2">
                  <View className="h-3.5 bg-gray-200 rounded-full w-3/4" />
                  <View className="h-3 bg-gray-200 rounded-full w-1/2" />
                </View>
                <View className="w-12 h-4 bg-gray-200 rounded-full" />
              </View>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {history.map((t, idx) => {
              const positive = t.amount > 0;
              const iconBg = positive ? "bg-green-100" : "bg-red-100";
              const iconColor = positive ? "#16A34A" : "#DC2626";
              const amountText = `${positive ? "+" : ""}${t.amount}`;
              return (
                <View key={t.id ?? idx} className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-3 border border-gray-100">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${iconBg}`}>
                    {positive ? <TrendingUp size={18} color={iconColor} /> : <TrendingDown size={18} color={iconColor} />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" numberOfLines={1}>{t.description}</Text>
                    <Text className="text-xs text-gray-500">{formatDate((t as any)?.createdAt ?? t.date)}</Text>
                  </View>
                  <Text className={`font-bold ${positive ? "text-green-600" : "text-red-600"}`}>{amountText}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
