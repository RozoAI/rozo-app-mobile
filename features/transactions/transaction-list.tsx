import { useCallback, useState } from "react";
import { FlatList, Linking, RefreshControl, Text } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import { useApp } from "@/providers/app.provider";
import { useBaseUSDCTransactions } from "@/resources/api/transactions";

import EmptyTransactionsState from "./empty-transactions";
import { TransactionCard } from "./transaction-card";

export function TransactionList() {
  const { primaryWallet } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useBaseUSDCTransactions({
    variables: { address: primaryWallet?.address || "", force: forceRefresh },
  });

  const txs = data?.pages.flat() ?? [];
  console.log("txs", JSON.stringify(txs, null, 2));

  const onRefresh = useCallback(() => {
    setForceRefresh(true);
    setRefreshing(true);
    refetch();

    setTimeout(() => {
      setForceRefresh(false);
    }, 500);
  }, [refetch]);

  if (isLoading) return <Spinner size="small" />;

  if (!isLoading && txs.length === 0) return <EmptyTransactionsState />;

  return (
    <FlatList
      data={txs}
      keyExtractor={(item) => item.hash}
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <TransactionCard
          transaction={item}
          onPress={() => Linking.openURL(item.url)}
        />
      )}
      ListFooterComponent={
        isFetchingNextPage ? (
          <Text style={{ padding: 10 }}>Loading more…</Text>
        ) : null
      }
      contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
