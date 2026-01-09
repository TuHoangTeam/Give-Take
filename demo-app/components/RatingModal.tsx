import { Star, X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  userName: string;
  userAvatar: string;
}

export function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  userName,
  userAvatar,
}: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      onClose();
    }
  };

  const ratingLabels = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời!"];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        <View className="flex-1 justify-center items-center px-4">
          <Pressable 
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="bg-[#FFD97D] p-6 pb-12 relative">
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <X size={20} color="#fff" />
              </Pressable>

              <Text className="text-2xl font-bold text-white text-center mb-2">
                Đánh giá giao dịch
              </Text>
              <Text className="text-white/80 text-center text-sm">
                Chia sẻ trải nghiệm của bạn
              </Text>
            </View>

            {/* Content */}
            <View className="p-6 -mt-8">
              {/* User card */}
              <View className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7DD3CE] to-[#FFB6C1] items-center justify-center">
                    <Text className="text-white font-semibold text-lg">
                      {userAvatar}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold">{userName}</Text>
                    <Text className="text-xs text-gray-500">Người cho/nhận</Text>
                  </View>
                </View>
              </View>

              {/* Star rating */}
              <View className="mb-6">
                <Text className="text-sm font-semibold mb-3 text-center">
                  Đánh giá của bạn
                </Text>
                <View className="flex-row justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        size={40}
                        color="#FFC94D"
                        fill={value <= rating ? "#FFC94D" : "none"}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-center mt-2 text-sm font-semibold text-[#FFC94D]">
                  {ratingLabels[rating - 1] || "Chọn đánh giá"}
                </Text>
              </View>

              {/* Comment */}
              <View className="mb-6">
                <Text className="text-sm font-semibold mb-2">
                  Nhận xét (không bắt buộc)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  className="min-h-[100px] rounded-xl border border-gray-200 p-3 text-sm"
                  textAlignVertical="top"
                />
              </View>

              {/* Actions */}
              <View className="space-y-3">
                <Pressable
                  onPress={handleSubmit}
                  className="h-14 rounded-full bg-[#FFD97D] items-center justify-center"
                >
                  <Text className="text-white font-semibold">Gửi đánh giá</Text>
                </Pressable>
                <Pressable
                  onPress={onClose}
                  className="h-14 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Text className="text-gray-700 font-semibold">Bỏ qua</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
