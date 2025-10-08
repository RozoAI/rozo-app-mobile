import { InfoIcon } from 'lucide-react-native';
import { useEffect } from 'react';

import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { useEVMWallet } from '@/hooks/use-evm-wallet';
import { useApp } from '@/providers/app.provider';

export function RequiredNetworkFee() {
  const { getBalance, ethBalance } = useEVMWallet();
  const { primaryWallet } = useApp();

  useEffect(() => {
    if (primaryWallet) {
      getBalance();
    }
  }, [primaryWallet]);

  if (Number(ethBalance?.display_values.eth) !== 0) {
    return null;
  }

  return (
    <Alert action="warning" variant="solid" className="mb-2">
      <AlertIcon as={InfoIcon} />
      <AlertText className="text-xs">
        Please note that the network fee is required to process the transaction. Send ETH in Base Network to the address
        above.
      </AlertText>
    </Alert>
  );
}
