import { CheckCircle2, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface TransactionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle: string;
  otherUserName: string;
  isGiver: boolean;
}

export function TransactionCompleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  otherUserName,
  isGiver,
}: TransactionCompleteModalProps) {
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
            <View className="bg-[#7DD3CE] p-6 pb-12 relative">
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <X size={20} color="#fff" />
              </Pressable>

              <View className="w-20 h-20 mx-auto bg-white/20 rounded-full items-center justify-center mb-4">
                <CheckCircle2 size={40} color="#fff" />
              </View>

              <Text className="text-2xl font-bold text-white text-center">
                Xác nhận hoàn thành
              </Text>
            </View>

            {/* Content */}
            <View className="p-6 -mt-8">
              <View className="bg-white rounded-2xl shadow-lg p-5 mb-6">
                <Text className="font-semibold text-center mb-2">
                  &ldquo;{itemTitle}&rdquo;
                </Text>
                <View className="text-center text-sm text-gray-600">
                  {isGiver ? (
                    <Text className="text-center">
                      Bạn xác nhận đã nhận được món đồ này từ{" "}
                      <Text className="text-[#7DD3CE] font-semibold">{otherUserName}</Text>?
                    </Text>
                  ) : (
                    <Text className="text-center">
                      Bạn xác nhận đã trao món đồ này cho{" "}
                      <Text className="text-[#7DD3CE] font-semibold">{otherUserName}</Text>?
                    </Text>
                  )}
                </View>
              </View>

              {/* Transaction details */}
              <View className="bg-[#A8E6E2]/20 rounded-2xl p-4 mb-6">
                <Text className="font-semibold text-sm mb-3">
                  Điều gì sẽ xảy ra:
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-start gap-2">
                    <Text className="text-yellow-600">●</Text>
                    <Text className="flex-1 text-sm">
                      Trừ 5 G-Point từ tài khoản bạn
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-green-600">●</Text>
                    <Text className="flex-1 text-sm">
                      Người cho nhận +10 G-Point
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-green-600">●</Text>
                    <Text className="flex-1 text-sm">
                      Tác động môi trường được ghi nhận
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-blue-600">●</Text>
                    <Text className="flex-1 text-sm">
                      Bạn có thể đánh giá người cho
                    </Text>
                  </View>
                </View>
              </View>

              {/* Warning */}
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
                <Text className="text-xs text-yellow-800">
                  ⚠️ Hành động này không thể hoàn tác. Chỉ xác nhận khi bạn đã thực sự trao đổi món đồ.
                </Text>
              </View>

              {/* Actions */}
              <View className="space-y-3">
                <Pressable
                  onPress={onConfirm}
                  className="h-14 rounded-full bg-[#7DD3CE] items-center justify-center"
                >
                  <Text className="text-white font-semibold">
                    Xác nhận hoàn thành
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onClose}
                  className="h-14 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Text className="text-gray-700 font-semibold">Hủy</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
