import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface SearchableInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: string) => void;
  onAddNew?: (text: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  allowNew?: boolean;
  containerStyle?: any;
}

export const SearchableInput: React.FC<SearchableInputProps> = ({
  value,
  onChangeText,
  onSelect,
  onAddNew,
  options,
  placeholder = "Type to search or add new farmer",
  label,
  allowNew = true,
  containerStyle,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync searchQuery with value when not focused
  React.useEffect(() => {
    if (!isFocus && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value, isFocus, searchQuery]);

  // Prepare data for dropdown
  const dropdownData = useMemo(() => {
    let filteredOptions = options;

    // Filter based on search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchLower),
      );
    }

    // Convert to dropdown format
    const data = filteredOptions.map((option) => ({
      label: option,
      value: option,
    }));

    // Add "Add New" option if applicable
    if (allowNew && searchQuery.trim()) {
      const exactMatch = options.find(
        (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase(),
      );

      if (!exactMatch) {
        data.push({
          label: `+ Add "${searchQuery.trim()}"`,
          value: `__ADD_NEW__${searchQuery.trim()}`,
        });
      }
    }

    return data;
  }, [options, searchQuery, allowNew]);

  const handleChange = (item: { label: string; value: string }) => {
    // Cancel any pending blur so it doesn't interfere after selection
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // Check if it's "Add New" item
    if (item.value.startsWith("__ADD_NEW__")) {
      const newValue = item.value.replace("__ADD_NEW__", "");
      if (onAddNew) {
        onAddNew(newValue);
        onChangeText(newValue);
      }
      setSearchQuery(newValue);
    } else {
      onChangeText(item.value);
      onSelect(item.value);
      setSearchQuery(item.value);
    }
    setIsFocus(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocus(true);
    setSearchQuery(value);
  };

  const handleBlur = () => {
    // Delay blur to allow item press to register
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocus(false);

      // Auto-select first filtered result on blur if no exact match
      if (searchQuery.trim() && dropdownData.length > 0) {
        const exactMatch = options.find(
          (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase(),
        );

        if (!exactMatch && !dropdownData[0].value.startsWith("__ADD_NEW__")) {
          onChangeText(dropdownData[0].value);
          onSelect(dropdownData[0].value);
          setSearchQuery(dropdownData[0].value);
        }
      }

      // Keep the search query in sync with the current value
      if (value && !searchQuery) {
        setSearchQuery(value);
      }
    }, 150);
  };

  const showList = isFocus && dropdownData.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.textInput, isFocus && styles.textInputFocused]}
        value={searchQuery}
        onChangeText={handleSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
      {showList && (
        <ScrollView
          style={styles.listContainer}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {dropdownData.map((item, index) => {
            const isAddNew = item.value.startsWith("__ADD_NEW__");
            return (
              <TouchableOpacity
                key={`${item.value}-${index}`}
                activeOpacity={0.6}
                onPress={() => handleChange(item)}
              >
                <View style={[styles.item, isAddNew && styles.addNewItem]}>
                  <Text
                    style={[styles.itemText, isAddNew && styles.addNewText]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#475569", // Slate 600
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Slate 200
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#0F172A", // Slate 900
  },
  textInputFocused: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  listContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    maxHeight: 250,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemText: {
    fontSize: 15,
    color: "#334155", // Slate 700
  },
  addNewItem: {
    backgroundColor: "#F0F9FF", // Sky 50
    borderBottomWidth: 0,
  },
  addNewText: {
    color: "#0284C7", // Sky 600
    fontWeight: "600",
  },
});
