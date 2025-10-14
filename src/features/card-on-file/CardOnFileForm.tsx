'use client'
import Loading from '@/common/components/Loading';
import { LOADING_DELAY } from '@/common/constants/loadingDelay';
import { useEffect, useState } from 'react';
import styles from './CardOnFileForm.module.css' 
import MerchantRow from './MerchantRow';  // Import the new MerchantRow component
import CardSelector from './CardSelector';  // Import CardSelector
import Notification, { NotificationType, NotificationTypeEnum } from '@/common/components/Notification';
import Filter from './Filter';
import ShoppingCart from '@/common/icons/ShoppingCart';
import DollarSign from '@/common/icons/DollarSign';
import Calendar from '@/common/icons/Calendar';
import Grid from '@/common/icons/Grid';
import Checkbox from '@/common/icons/Checkbox';
import Target from '@/common/icons/Target';
import TrendingUp from '@/common/icons/TrendingUp';



// Define the types for the response data
interface Merchant {
  mCC: string;
  mrchName: string;
  totalTranCount: string;
  lastTranAmt: string;
  lastTranCurrency: string;
  lastTranDateTime: string;
}

interface CardOnFileResponse {
  responseData: {
    panList: Array<{
      panData: {
        panResponseMsg: string;
        merchants: Merchant[];
      };
    }>;
  };
  status: {
    statusCode: string;      
    statusDescription: string;
  };
  };

interface VspsAddMerchantResponse {
  responseCode: string;
  responseDescription: string;
  stopInstructions: Array<{
    result: {
      resultCode: string;
      resultMessage: string;
    };
    stopInstructionId: string;
    merchantName: string;
  }>;
}

export interface VspsSearchMerchantResponse {
  result: {
    resultCode: string;
    resultMessage: string;
  };
  searchedStopInstructions: {
    stopInstructionId: string;
    status: string;
    stopInstructionType: string;
    oneTimeStop: boolean;
    startDate: string;
    endDate: string;
    merchantIdentifier: {
      merchantName: string;
    };
    transactionAmount: {
      maxAmount: number;
    };
    auditInformation: {
      originChannel: string;
      creationDateTime: string;
      createdByUser: string;
    };
    recurringAndInstallmentIndicator: boolean;
  }[];
}

export interface VspsCancelMerchantResponse {
  cancelledStopInstructions: Array<{
    result: {
      resultCode: string;
      resultMessage: string;
    };
    stopInstructionId: string;
  }>;
  responseDescription: string;
  responseCode: string;
}

export default function CardOnFileForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CardOnFileResponse | null>(null);
  const [blockedMerchantNames, setBlockedMerchantNames] = useState<Record<string, string>>({});
  const [isStatusLoading, setIsStatusLoading] = useState(true);  // For the status loading state
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(cards[0])
  const [loadingMerchantName, setLoadingMerchantName] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');


  // For success or error messages
  const [notificationState, setNotificationState] = useState({
    message: '',
    type: null as NotificationType,
  });

  // Check if loading delay is applied
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }
    , LOADING_DELAY);
  }, []);

  // fetch cards based on user login credentials
  const fetchCards = async () => {
    try {
      const userToken = sessionStorage.getItem('userToken');
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          },
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data.message);
        setSelectedCard(data.message.find((card: any) => card?.cardNumber === selectedCard?.cardNumber));
      } else {
          throw new Error('Failed to fetch cards');
        }
        } catch (error) {
          console.error(error);
          setNotificationState({
            message: 'Failed to load cards',
            type: NotificationTypeEnum.ERROR,
          });
        }
  };

  //Get user token from session storage
  useEffect(() => {
    const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');
    token && fetchCards();
  }, []);

  // User selection for card
  useEffect(() => {
    if (!selectedCard) {
      // User unselected, so reset everything
      setData(null);
      return;
    }
    const syntheticEvent = {
      preventDefault: () => {}, 
    };
    handleSubmit(syntheticEvent as React.FormEvent); // Pass the synthetic event to handleSubmit
  }, [selectedCard]);


  // Call Card on file API to retrieve list of merchants. Afterwhich, call VSPS Search to fetch blocked merchants
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCard) {
      setNotificationState({
        message: 'Please select a card.',
        type: NotificationTypeEnum.ERROR,
      });
      return;
    }

     // Set loading to true when the user clicks submit
     setIsLoadingApi(true);

     try {
      // Send the PAN to the API endpoint
      const pan = selectedCard?.cardNumber; // Use the selected card number
      const response = await fetch(
        `/api/card-on-file/[slug]?pan=${pan}`
      );
      
      // Check if the response is okay (status code 200)
      if (response.ok) {
        const result: CardOnFileResponse = await response.json();
    
        // Check custom API status code
        if (result.status?.statusCode !== 'CDI000') {
          setNotificationState({
            message: result.status?.statusDescription,
            type: NotificationTypeEnum.ERROR,
          });
        } else {
          setData(result);  // Update state with successful data
          setIsLoadingApi(false);
    
          // Call VSPS search API
          const vspsResponse = await fetch(`/api/vsps/search?pan=${pan}`);
          const vspsResult: VspsSearchMerchantResponse = await vspsResponse.json();
    
          if (vspsResult.result.resultCode === '00') {
            // Get blocked merchant names
            const blockedDict: Record<string, string> = {}; // merchantName -> stopInstructionId
    
            (vspsResult.searchedStopInstructions || []).forEach(instr => {
              const merchantName = instr.merchantIdentifier?.merchantName;
              const stopInstructionId = instr.stopInstructionId;
            
              if (merchantName && stopInstructionId) {
                blockedDict[merchantName.toUpperCase()] = stopInstructionId;
              }
            });
            
            // Now set it
            setBlockedMerchantNames(blockedDict);
          } else {
            setNotificationState({
              message: `Error fetching blocked merchants: ${vspsResult.result.resultMessage}`,
              type: NotificationTypeEnum.ERROR,
            });
          }
        }
      } else {
        setNotificationState({
          message: 'Error fetching data',
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotificationState({
        message: 'Error fetching data',
        type: NotificationTypeEnum.ERROR,
      });
    } finally {
      // Reset loading state
      setIsStatusLoading(false);  // Once the VSPS API call is done, set this to false
    }
  }
    

  if (isLoading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    )
  }

  const merchants = data?.responseData?.panList?.[0]?.panData?.merchants || [];

  const handleBlockMerchant = async (merchant: Merchant) => {
    console.log('Blocking merchant:', merchant.mrchName);
    const pan = selectedCard?.cardNumber; // Use the selected card number
    setLoadingMerchantName(merchant.mrchName.toUpperCase());  // start button loading
    try {
      const response = await fetch(
        `/api/vsps/add?pan=${encodeURIComponent(pan)}&merchantName=${encodeURIComponent(merchant.mrchName)}`
      );

      // Check if the response is successful
      if (response.ok) {
        const result: VspsAddMerchantResponse = await response.json();

        if (result.responseCode === '00') {
          setBlockedMerchantNames(prev => ({
            ...prev,
            [merchant.mrchName.toUpperCase()]: result.stopInstructions[0].stopInstructionId
          }));
  
          // Show success notification
          setNotificationState({
            message: `Successfully blocked ${merchant.mrchName}`,
            type: NotificationTypeEnum.SUCCESS,
          });
        } else {
          // Show error notification
          setNotificationState({
            message: `Error blocking ${merchant.mrchName}: ${result.responseDescription}`,
            type: NotificationTypeEnum.ERROR,
          });
        }
      }
    } catch (error) {
      console.error('Error calling block merchant API:', error);
      setNotificationState({
        message: `Unexpected error blocking ${merchant.mrchName}`,
        type: NotificationTypeEnum.ERROR,
      });
    } finally {
      setLoadingMerchantName(null);  // stop button loading
    }
  };

  const handleCancelBlock = async (merchant: Merchant) => {
    console.log('Canceling block for merchant:', merchant.mrchName);
    setLoadingMerchantName(merchant.mrchName.toUpperCase());  // start button loading
  
    const stopInstructionId = blockedMerchantNames[merchant.mrchName.toUpperCase()];
    if (!stopInstructionId) {
      setNotificationState({
        message: `No stopInstructionId found for merchant: ${merchant.mrchName}`,
        type: NotificationTypeEnum.ERROR,
      });
      return;
    }
  
    try {
      const response = await fetch(
        `/api/vsps/cancel?stopInstructionId=${encodeURIComponent(stopInstructionId)}`
      );
  
      if (response.ok) {
        const result: VspsCancelMerchantResponse = await response.json();
  
        if (result.responseCode === '00') {
          setBlockedMerchantNames(prev => {
            const updated = { ...prev };
            delete updated[merchant.mrchName.toUpperCase()];
            return updated;
          });
  
          // Show success notification
          setNotificationState({
            message: `Successfully unblocked ${merchant.mrchName}`,
            type: NotificationTypeEnum.SUCCESS,
          });
        } else {
          // Show error notification
          setNotificationState({
            message: `Error canceling block for ${merchant.mrchName}: ${result.responseDescription}`,
            type: NotificationTypeEnum.ERROR,
          });
        }
      }
    } catch (error) {
      console.error('Error calling cancel block merchant API:', error);
      setNotificationState({
        message: `Unexpected error canceling block for ${merchant.mrchName}`,
        type: NotificationTypeEnum.ERROR,
      });
    } finally {
      setLoadingMerchantName(null);  // stop button loading
    }
  };
  
    //Placeholder for block all button
    const handleBlockAllMerchants = async () => {  
      for (const merchant of merchants) {
        const isAlreadyBlocked = blockedMerchantNames[merchant.mrchName.toUpperCase()];
        if (!isAlreadyBlocked) {
          await handleBlockMerchant(merchant);
        }
      }
    };

  const isMerchantBlocked = (merchantName: string) => {
    return merchantName.toUpperCase() in blockedMerchantNames;
  };
  
  console.log('Blocked Merchant Dictionary:', JSON.stringify(blockedMerchantNames, null, 2));

  return (
    <div>
      {/* Notification */}
      {notificationState.message && (
        <Notification
          message={notificationState.message}
          type={notificationState.type}
          onClose={() => setNotificationState({ message: '', type: null })}
        />
      )}
      <p>
        View all merchants that are storing your card credentials
      </p>
      {/* Card Selector */}
      <CardSelector
        cardDetails={cards}
        setSelectedCard={setSelectedCard}
        selectedCard={selectedCard}
      />
      
      {/* Loading Spinner */}
      {isLoadingApi && (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      )}
  
      {/* Merchants List */}
      {merchants.length > 0 && (
        <div style={{ marginTop: '1px' }}>
          <div style={{ marginBottom: '10px' }}>
            <button onClick={handleBlockAllMerchants}  className={styles.blockAll}>
              Block All Merchants
            </button>
          </div>
          <Filter
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <h3 style={{ marginBottom: '20px' }}>Merchant Details</h3>
          <table className={styles.table}>
            <thead>
              <tr>
              <th className={styles.th}>
                <ShoppingCart style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                Name
              </th>
              <th className={styles.th}>
                <Grid style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                MCC
              </th>
              <th className={styles.th}>
                <TrendingUp style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                Transaction Count
              </th>
                <th className={styles.th}>
                  <DollarSign style={{ width: '14px', height: '14px', marginRight: '4px' }} stroke="#FF5B27" />
                  Last Trans Amount
              </th>
              <th className={styles.th}>
                  <Calendar style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                  Last Trans Date
              </th>
              <th className={styles.th}>
                  <Target style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                  Status
              </th>
              <th className={styles.th}>
                  <Checkbox style={{ width: '14px', height: '14px', marginRight: '8px' }} stroke="#FF5B27"  />
                  Action
              </th>
              </tr>
            </thead>
            <tbody>
              {merchants
                .filter((merchant) => {
                  const isBlocked = isMerchantBlocked(merchant.mrchName);
                  const matchesName = merchant.mrchName.toLowerCase().includes(nameFilter.toLowerCase());
                  const matchesStatus =
                  statusFilter === 'all'
                    ? true // if "all", don't filter by status
                    : statusFilter === 'active'
                      ? !isBlocked
                      : isBlocked;
                      const matchesDate = dateFilter
                      ? merchant.lastTranDateTime.slice(0, 10) >= dateFilter
                      : true;
                  return matchesName && matchesStatus && matchesDate;
                })
                .map((merchant, idx) => (
                  <MerchantRow
                    key={idx}
                    merchant={merchant}
                    blockedMerchantNames={blockedMerchantNames}
                    handleBlockMerchant={handleBlockMerchant}
                    handleCancelBlock={handleCancelBlock}
                    isMerchantBlocked={isMerchantBlocked}
                    isStatusLoading={isStatusLoading}
                    loadingMerchantName={loadingMerchantName}
                  />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}  