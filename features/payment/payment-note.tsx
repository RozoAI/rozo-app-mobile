// Start of Selection
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import useKeyboardBottomInset from "@/hooks/use-keyboard-bottom-inset";
import { cn } from "@/libs/utils";

type ActionSheetPaymentNoteProps = {
  isEdit?: boolean;
  onSubmit?: (note: string) => void;

  value?: string;
};

// Form schema with Zod validation
const noteFormSchema = z.object({
  note: z.string().max(100, "Note cannot exceed 100 characters"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export function ActionSheetPaymentNote({
  isEdit = false,
  value,
  onSubmit,
}: ActionSheetPaymentNoteProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { t } = useTranslation();
  const bottomInset = useKeyboardBottomInset();
  const insets = useSafeAreaInsets();

  // React Hook Form setup with Zod validation
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: value ?? "",
    },
  });

  // Callbacks
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleOnCancelNote = useCallback(() => {
    reset();
    setIsOpen(false);
  }, [reset]);

  const handleOnSubmitNote = useCallback(
    handleSubmit((data) => {
      const trimmedNote = data.note.trim();
      onSubmit?.(trimmedNote);
      handleClose();
    }),
    [onSubmit, handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      reset({ note: value ?? "" });
    }
  }, [value, isOpen]);

  return (
    <>
      <Button className={cn("text-center")} variant="link" onPress={handleOpen}>
        <ButtonIcon
          as={value ? Edit : Plus}
          className="text-black dark:text-white"
        />
        <ButtonText className="text-black dark:text-white">
          {value
            ? `${t("general.note")}: ${
                value.length > 20 ? `${value.substring(0, 20)}...` : value
              }`
            : t("general.addNote")}
        </ButtonText>
      </Button>

      <Actionsheet isOpen={isOpen} onClose={handleClose} trapFocus={false}>
        <ActionsheetBackdrop />
        <ActionsheetContent
          style={{ paddingBottom: bottomInset + insets.bottom }}
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack space="lg" className="w-full">
            <Box className="items-center">
              <Heading size="lg" className="text-typography-950">
                {t("payment.notes.title")}
              </Heading>
            </Box>

            <View className="flex-col gap-2">
              <Textarea size="md" isReadOnly={false} className="rounded-xl">
                <Controller
                  control={control}
                  name="note"
                  render={({ field: { onChange, value } }) => (
                    <TextareaInput
                      placeholder={t("payment.notes.enterNote")}
                      value={value}
                      onChangeText={onChange}
                      onSubmitEditing={handleOnSubmitNote}
                      returnKeyType="done"
                      maxLength={100}
                    />
                  )}
                />
              </Textarea>
              <HStack className="justify-between px-1">
                <Text className="text-xs text-neutral-500">
                  {t("general.maxCharacters", { count: 100 })}
                </Text>
                <Text className="text-xs text-neutral-500">
                  {watch("note")?.length || 0}/100
                </Text>
              </HStack>
              {errors.note && (
                <Text className="text-sm text-red-500">
                  {errors.note.message}
                </Text>
              )}

              <View className="mt-4 flex-col gap-2">
                <Button
                  size="lg"
                  variant="solid"
                  className="w-full rounded-xl"
                  onPress={handleOnSubmitNote}
                  isDisabled={!isValid}
                >
                  <ButtonText className="text-white">
                    {t("general.submit")}
                  </ButtonText>
                </Button>
                <Button
                  size="lg"
                  className="w-full rounded-xl"
                  variant="link"
                  onPress={isEdit ? handleClose : handleOnCancelNote}
                >
                  <ButtonText>
                    {isEdit ? t("general.close") : t("general.cancel")}
                  </ButtonText>
                </Button>
              </View>
            </View>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
// End of Selection
