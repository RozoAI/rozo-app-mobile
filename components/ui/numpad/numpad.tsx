import { useColorScheme } from "nativewind";
import React from "react";
import {
  Dimensions,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const { width } = Dimensions.get("window");

export interface NumPadProps {
  onPress: (value: string) => void;
  decimalSeparator?: "." | ",";
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

const dialPadContent = [1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "X"];
const dialPadSize = width * 0.25;
const dialPadTextSize = dialPadSize * 0.4;

export const NumPad: React.FC<NumPadProps> = ({
  onPress,
  decimalSeparator = ".",
  buttonStyle,
  buttonTextStyle,
  containerStyle,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const defaultButtonStyle: ViewStyle = {
    width: dialPadSize,
    height: dialPadSize,
    borderRadius: dialPadSize / 2,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    marginHorizontal: 4,
    shadowColor: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: isDark ? "#374151" : "#e5e7eb",
  };

  const defaultButtonTextStyle: TextStyle = {
    fontSize: dialPadTextSize,
    fontWeight: "600",
    color: isDark ? "#f9fafb" : "#111827",
  };

  const defaultContainerStyle: ViewStyle = {
    flexDirection: "column",
    padding: 16,
    backgroundColor: isDark ? "#111827" : "#f9fafb",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  };

  const handlePress = (item: string | number) => {
    if (item === "X") {
      onPress("delete");
    } else if (item === ".") {
      onPress(decimalSeparator);
    } else if (item === 0) {
      onPress("0");
    } else if (typeof item === "number") {
      onPress(item.toString());
    } else {
      onPress(item);
    }
  };

  // Create rows for 3-column layout
  const createRows = () => {
    const rows = [];
    for (let i = 0; i < dialPadContent.length; i += 3) {
      rows.push(dialPadContent.slice(i, i + 3));
    }
    return rows;
  };

  const rows = createRows();

  return (
    <View style={[defaultContainerStyle, containerStyle]}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 12,
          }}
        >
          {row.map((item, colIndex) => (
            <TouchableOpacity
              key={`${rowIndex}-${colIndex}`}
              onPress={() => handlePress(item)}
              style={[defaultButtonStyle, buttonStyle]}
              activeOpacity={0.7}
            >
              <Text style={[defaultButtonTextStyle, buttonTextStyle]}>
                {item === "X" ? "⌫" : item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};
