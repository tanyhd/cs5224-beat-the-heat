import React from 'react';
import Button from '@/common/components/Button';
import Spinner from '@/common/components/Spinner';  // Adjust the path as necessary
import styles from './CardOnFileForm.module.css';

interface Merchant {
  mCC: string;
  mrchName: string;
  totalTranCount: string;
  lastTranAmt: string;
  lastTranCurrency: string;
  lastTranDateTime: string;
}

interface MerchantRowProps {
  merchant: Merchant;
  blockedMerchantNames: { [merchantName: string]: string };
  isMerchantBlocked: (merchantName: string) => boolean;
  handleCancelBlock: (merchant: Merchant) => Promise<void>;
  handleBlockMerchant: (merchant: Merchant) => Promise<void>;
  isStatusLoading: boolean;
  loadingMerchantName: string | null;  // <-- allow null
}

const MerchantRow: React.FC<MerchantRowProps> = ({
  merchant,
  handleBlockMerchant,
  handleCancelBlock,
  isMerchantBlocked,
  isStatusLoading,
  loadingMerchantName
}) => {
  const isBlocked = isMerchantBlocked(merchant.mrchName);

  return (
    <tr>
      <td className={styles.td}>{merchant.mrchName}</td>
      <td className={styles.td}>{merchant.mCC}</td>
      <td className={styles.td}>{merchant.totalTranCount}</td>
      <td className={styles.td}>
        {`${merchant.lastTranAmt} ${merchant.lastTranCurrency}`}
      </td>
      <td className={styles.td}>{merchant.lastTranDateTime.slice(0, 10)}</td>
      <td className={styles.td}>
        {(() => {
          if (isStatusLoading || loadingMerchantName === merchant.mrchName.toUpperCase()) {
            return (
              <div className={styles.spinnerContainer}>
                <Spinner />
              </div>
            );  // Show spinner with centered container
          } else {
            return isMerchantBlocked(merchant.mrchName) ? 'Blocked' : 'Active';
          }
        })()}
      </td>
      <td className={styles.td}>
        <div className={styles.buttonContainer}>
          <Button
            onClick={() => {
              // Block or cancel based on current status
              isBlocked ? handleCancelBlock(merchant) : handleBlockMerchant(merchant);
            }}
            disabled={isStatusLoading || loadingMerchantName === merchant.mrchName.toUpperCase()}  // Disable button if loading
            className={loadingMerchantName === merchant.mrchName.toUpperCase() ? 'loading' : isBlocked ? styles.cancelButton : styles.blockButton}
          >
            {isStatusLoading || loadingMerchantName === merchant.mrchName.toUpperCase() ? (
              <div className={styles.spinner}>
                <Spinner />
              </div>
            ) : isBlocked ? (
              'Cancel'
            ) : (
              'Block'
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default MerchantRow;
