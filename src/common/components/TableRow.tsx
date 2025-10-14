import styles from './TableRow.module.css'

interface TableRowProps {
   children?: React.ReactNode;
}

export default function TableRow ({children, ...props}: TableRowProps) {
   return (
      <tr className={styles.tableRow} {...props}>{children}</tr>
   )
}