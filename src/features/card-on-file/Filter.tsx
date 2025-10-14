import styles from './Filter.module.css';

interface FilterProps {
  nameFilter: string;
  setNameFilter: React.Dispatch<React.SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: 'all' | 'active' | 'blocked';
  setStatusFilter: React.Dispatch<React.SetStateAction<'all' | 'active' | 'blocked'>>;
}

const Filter: React.FC<FilterProps> = ({
  nameFilter,
  setNameFilter,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
        {/* Name Filter */}
        <div className={styles.inputContainer}>
          <label htmlFor="nameFilter" className={styles.label}>Name</label>
          <input
            id="nameFilter"
            type="text"
            placeholder="Filter by Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Date Filter */}
        <div className={styles.inputContainer}>
          <label htmlFor="dateFilter" className={styles.label}>Last Trans Date</label>
          <input
            id="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Status Filter */}
        <div className={styles.inputContainer}>
          <label htmlFor="statusFilter" className={styles.label}>Status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            className={styles.select}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filter;