import { Button, ButtonText } from '@/components/ui/button';
import { Countdown } from '@/components/ui/countdown';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { addMinutes } from 'date-fns';
import React, { useState } from 'react';

/**
 * Example component demonstrating the Countdown component usage
 * This is for documentation purposes and can be removed in production
 */
export const CountdownExample: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(300); // 5 minutes
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [countdownType, setCountdownType] = useState<'duration' | 'date'>('duration');

  const handleStart = () => {
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setDuration(300);
    setTargetDate(undefined);
  };

  const handleComplete = () => {
    console.log('Countdown completed!');
    setIsActive(false);
  };

  const setTargetTime = (minutes: number) => {
    const newTargetDate = addMinutes(new Date(), minutes);
    setTargetDate(newTargetDate);
    setCountdownType('date');
  };

  return (
    <View className="p-4">
      <VStack space="lg" className="items-center">
        <Text className="text-xl font-bold">Countdown Example</Text>
        
        <Countdown
          duration={countdownType === 'duration' ? duration : undefined}
          targetDate={countdownType === 'date' ? targetDate : undefined}
          onComplete={handleComplete}
          showSpinner={true}
          textSize="2xl"
          textColor="text-blue-600 dark:text-blue-400"
          isActive={isActive}
          className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          completedText="Countdown finished!"
          expiredText="Target time has passed"
        />

        <VStack space="sm" className="w-full">
          <Button
            variant="solid"
            action="positive"
            onPress={handleStart}
            disabled={isActive}
            className="w-full"
          >
            <ButtonText>Start Countdown</ButtonText>
          </Button>

          <Button
            variant="outline"
            onPress={handleStop}
            disabled={!isActive}
            className="w-full"
          >
            <ButtonText>Stop</ButtonText>
          </Button>

          <Button
            variant="outline"
            action="negative"
            onPress={handleReset}
            className="w-full"
          >
            <ButtonText>Reset</ButtonText>
          </Button>
        </VStack>

        <VStack space="xs" className="w-full">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Countdown Type:
          </Text>
          <VStack space="xs" className="flex-row">
            <Button
              size="sm"
              variant={countdownType === 'duration' ? 'solid' : 'outline'}
              onPress={() => setCountdownType('duration')}
              className="flex-1"
            >
              <ButtonText>Duration</ButtonText>
            </Button>
            <Button
              size="sm"
              variant={countdownType === 'date' ? 'solid' : 'outline'}
              onPress={() => setCountdownType('date')}
              className="flex-1"
            >
              <ButtonText>Target Date</ButtonText>
            </Button>
          </VStack>
        </VStack>

        {countdownType === 'duration' && (
          <VStack space="xs" className="w-full">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Duration Options:
            </Text>
            <VStack space="xs" className="flex-row flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setDuration(60)}
                className="flex-1"
              >
                <ButtonText>1 min</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => setDuration(300)}
                className="flex-1"
              >
                <ButtonText>5 min</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => setDuration(600)}
                className="flex-1"
              >
                <ButtonText>10 min</ButtonText>
              </Button>
            </VStack>
          </VStack>
        )}

        {countdownType === 'date' && (
          <VStack space="xs" className="w-full">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Target Time Options:
            </Text>
            <VStack space="xs" className="flex-row flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setTargetTime(5)}
                className="flex-1"
              >
                <ButtonText>5 min from now</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => setTargetTime(30)}
                className="flex-1"
              >
                <ButtonText>30 min from now</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => setTargetTime(60)}
                className="flex-1"
              >
                <ButtonText>1 hour from now</ButtonText>
              </Button>
            </VStack>
            {targetDate && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Target: {targetDate.toLocaleString()}
              </Text>
            )}
          </VStack>
        )}
      </VStack>
    </View>
  );
};
