import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, MapPin, MoreVertical, Package, Send } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { RatingModal } from "../../components/RatingModal";
import { SuccessAnimationNative } from "../../components/SuccessAnimationNative";
import { TransactionCompleteModal } from "../../components/TransactionCompleteModal";
import {
  completeTransaction,
  confirmReceiver,
  getItem,
  getMe,
  getTransaction,
  postRating
} from "../../utils/api";

type ChatMessage = {
  id: string;
  senderId?: string;
  sender?: { id: string; name?: string };
  text?: string;
  createdAt?: string;
  pending?: boolean;
};

type ItemDetail = {
  id: string;
  title?: string;
  location?: string;
  estimatedCO2?: number;
  owner?: { id: string; name?: string; avatar?: string };
};

const formatTime = (value?: string) => {
  if (!value) return "Vừa xong";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string; transactionId?: string; ownerId?: string }>();
  
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [meRes, txRes, itemRes] = await Promise.all([
        me ? Promise.resolve(me) : getMe().catch(() => null),
        params.transactionId ? getTransaction(String(params.transactionId)).catch(() => null) : Promise.resolve(null),
        params.itemId ? getItem(String(params.itemId)).catch(() => null) : Promise.resolve(null),
      ]);

      if (meRes) setMe(meRes);

      if (txRes) {
        setTransaction(txRes);
        if (txRes?.item) setItemDetail(txRes.item);
      }

      if (!txRes && itemRes) {
        setItemDetail(itemRes);
      }

      // Add some demo messages for now
      setMessages([
        {
          id: "1",
          text: "Xin chào! Bạn quan tâm đến ghế sofa của mình à?",
          createdAt: new Date(Date.now() - 600000).toISOString(),
          senderId: params.ownerId || "owner",
        },
        {
          id: "2",
          text: "Chào bạn! Mình thấy ghế rất đẹp. Không biết còn không?",
          createdAt: new Date(Date.now() - 300000).toISOString(),
          senderId: "me",
          pending: false,
        },
        {
          id: "3",
          text: "Còn nha! Bạn có thể đến lấy được không?",
          createdAt: new Date(Date.now() - 180000).toISOString(),
          senderId: params.ownerId || "owner",
        },
        {
          id: "4",
          text: "Được chứ! Mình có thể đến chiều nay được không?",
          createdAt: new Date(Date.now() - 60000).toISOString(),
          senderId: "me",
          pending: false,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải dữ liệu";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.itemId, params.transactionId, params.ownerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const otherUser = useMemo(() => {
    if (transaction?.giver) return transaction.giver;
    if (itemDetail?.owner) return itemDetail.owner;
    return {
      id: params.ownerId || "owner",
      name: "Minh Anh",
      avatar: "MA",
    };
  }, [transaction?.giver, itemDetail?.owner, params.ownerId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    
    setInput("");
    const optimistic: ChatMessage = {
      id: `pending-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      senderId: "me",
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    
    // In a real app, send to backend
    setTimeout(() => {
      setMessages((prev) => 
        prev.map((m) => 
          m.id === optimistic.id 
            ? { ...m, pending: false, id: String(Date.now()) }
            : m
        )
      );
    }, 500);
  };

  const handleConfirmTransaction = async () => {
    if (!params.transactionId) return;
    
    try {
      // Confirm as receiver
      await confirmReceiver(String(params.transactionId));

      // Mark completed
      await completeTransaction(String(params.transactionId));
      
      // Close confirm modal and show success
      setShowConfirmModal(false);
      
      // Wait a bit before showing success animation
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể xác nhận giao dịch");
    }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!params.transactionId) return;
    const toUserId = transaction?.giver?.id || itemDetail?.owner?.id || params.ownerId;
    if (!toUserId) {
      Alert.alert("Thiếu thông tin", "Không xác định được người để đánh giá");
      return;
    }
    
    try {
      await postRating({
        transactionId: String(params.transactionId),
        toUserId: String(toUserId),
        rating,
        comment,
      });
      Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá!");
      router.back();
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể gửi đánh giá");
    }
  };

  const headerName = otherUser?.name || "Cuộc trò chuyện";
  const headerStatus = "Đang hoạt động";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#7DD3CE" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#111" />
        </Pressable>
        <View className="flex-row items-center gap-3 flex-1 mx-4">
          <View className="w-10 h-10 rounded-full bg-[#7DD3CE]  items-center justify-center">
            <Text className="text-white font-semibold">
              {(otherUser?.name || "?").slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold" numberOfLines={1}>{headerName}</Text>
            <Text className="text-xs text-gray-500">{headerStatus}</Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 rounded-full items-center justify-center">
          <MoreVertical size={20} color="#111" />
        </Pressable>
      </View>

      {/* Item Card */}
      {itemDetail && (
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-start gap-3">
            <View className="w-14 h-14 rounded-xl bg-[#A8E6E2]/20 items-center justify-center">
              <Package size={24} color="#7DD3CE" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold mb-1" numberOfLines={2}>{itemDetail.title || "Món đồ"}</Text>
              <View className="flex-row items-center gap-1 mb-2">
                <MapPin size={12} color="#6B7280" />
                <Text className="text-xs text-gray-500" numberOfLines={1}>{itemDetail.location || "Chưa rõ vị trí"}</Text>
              </View>
              <Pressable 
                onPress={() => setShowConfirmModal(true)}
                className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-[#7DD3CE]"
              >
                <CheckCircle size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold">Xác nhận đã trao đổi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={["#7DD3CE"]} />}
        ListEmptyComponent={!loading ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500">Chưa có tin nhắn</Text>
          </View>
        ) : null}
        renderItem={({ item }) => {
          const isMe = item.senderId === "me" || item.pending;
          return (
            <View className={`flex ${isMe ? "items-end" : "items-start"} mb-3`}>
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                  isMe ? "bg-[#7DD3CE]" : "bg-white"
                } ${item.pending ? "opacity-70" : ""}`}
              >
                <Text className={isMe ? "text-white" : "text-gray-800"}>{item.text}</Text>
                <Text className={`text-xs mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t px-4 py-4">
        <View className="flex-row items-center gap-2">
          <TextInput
            placeholder="Nhập tin nhắn..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            className="flex-1 h-12 rounded-full bg-gray-100 px-4"
            placeholderTextColor="#9CA3AF"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center bg-[#7DD3CE]`}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
        {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}
      </View>

      {/* Modals */}
      <TransactionCompleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmTransaction}
        itemTitle={itemDetail?.title || ""}
        otherUserName={otherUser?.name || ""}
        isGiver={false}
      />

      <SuccessAnimationNative
        isVisible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setShowRatingModal(true);
        }}
        type="receive"
        co2Saved={itemDetail?.estimatedCO2 || 3.5}
        pointsEarned={0}
      />

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        userName={otherUser?.name || "Người dùng"}
        userAvatar={(otherUser?.name || "?").slice(0, 2).toUpperCase()}
      />
    </KeyboardAvoidingView>
  );
}
