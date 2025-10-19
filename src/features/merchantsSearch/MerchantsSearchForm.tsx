'use client'
import Button from '@/common/components/Button';
import InputLabel from '@/common/components/InputLabel';
import { useState, JSX } from 'react';
import styles from './MerchantsSearchForm.module.css'
import { LinkDetailBox } from '@/common/components/DetailBox';
import Code from '@/common/icons/Code';
import FileText from '@/common/icons/FileText';
import Link from '@/common/icons/Link';
import Grid from '@/common/icons/Grid';
import { LOADING_DELAY } from '@/common/constants/loadingDelay';
import Loading from '@/common/components/Loading';

export default function MerchantSearchForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [merchantResult, setMerchantResult] = useState({ mcc: '', mccDescription: '', legalName: '', storeName: '', url: '' });
  const INPUT_SEQUENCE = [
    {
      name: 'merchantName',
      label: 'Merchant Name',
      required: true
    }, {
      name: 'merchantCity',
      label: 'Merchant City',
      required: false
    }, {
      name: 'merchantAddress',
      label: 'Merchant Address',
      required: false
    }];
  const RESULT_SEQUENCE: { map: keyof typeof merchantResult; label: string; icon: JSX.Element }[] = [{
    map: 'mcc',
    label: 'Merchant Category Code',
    icon: <Code stroke={"#06B6D4"} />
  }, {
    map: 'mccDescription',
    label: 'Category Description',
    icon: <FileText stroke={"#06B6D4"} />
  }, {
    map: 'storeName',
    label: 'Merchant Name',
    icon: <Grid stroke={"#06B6D4"} />
  }, {
    map: 'url',
    label: 'Merchant URL',
    icon: <Link stroke={"#06B6D4"} />,
  }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get("merchantName");
    const city = formData.get("merchantCity");
    const address = formData.get("merchantAddress");

    try {
      const response = await fetch(
        `/api/merchants/search?name=${name}&city=${city}&address=${address}`
      );
      const data = await response.json();
      const firstResult = data?.merchantSearchServiceResponse?.response?.[0]?.responseValues;
      setMerchantResult({
        mcc: firstResult?.primaryMerchantCategoryCode,
        mccDescription: firstResult?.merchantCategoryCodeDesc?.[0],
        legalName: firstResult?.businessLegalName?.[0],
        storeName: firstResult?.visaStoreName,
        url: firstResult?.merchantUrl?.[0],
      });
      setTimeout(() => {
        setIsLoading(false);
      }, LOADING_DELAY);
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
      >
        {INPUT_SEQUENCE.map((input, index) => (
          <InputLabel
            key={index}
            labelProps={{ text: input.label }}
            inputProps={{
              name: input.name,
              type: "text",
              required: input.required,
              placeholder: `Enter ${input.label}`
            }}
          />
        ))}
        <div className={styles.buttonGroup}>
          <Button type="submit">Search</Button>
          <Button type="reset" variant='secondary'>Clear</Button>
        </div>
      </form>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      )}
      {merchantResult?.mcc && !isLoading && (
        <div>
          <h3 className={styles.subHeader}>Merchant Search Result</h3>
          <div className={styles.resultContainer}>
            {RESULT_SEQUENCE.map((result, index) => (
              <LinkDetailBox
                id={index}
                key={index}
                details={{
                  label: result.label,
                  subLabel: merchantResult[result.map],
                  icon: result.icon,
                  link: result.map === 'url' ? merchantResult[result.map] : undefined,
                  linkText: result.map === 'url' ? 'Visit Merchant' : undefined,
                  newTab: true,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}