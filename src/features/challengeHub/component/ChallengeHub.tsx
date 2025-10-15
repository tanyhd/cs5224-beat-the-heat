import Button from '@/common/components/Button';
import SubDetails from '@/common/components/SubDetails';
import Clock from '@/common/icons/Clock';
import DollarSign from '@/common/icons/DollarSign';
import Info from '@/common/icons/Info';
import ShoppingCart from '@/common/icons/ShoppingCart';
import styles from './ChallengeHub.module.css'
import TableRow from '@/common/components/TableRow';
import AvatarPlus from '@/common/icons/AvatarPlus';
import Avatar from '@/common/icons/Avatar';

export interface Challenge {
  _id?: MongoId;
  section?: string;
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
}

type MongoId = string | { $oid: string };

function keyFromId(id: MongoId | undefined, fallback: string) {
  if (!id) return fallback;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id && typeof id.$oid === 'string') return id.$oid;
  return fallback;
}

export default function Challenges({ challenges }: { challenges: Challenge[] }) {
  if (!Array.isArray(challenges) || challenges.length === 0) {
    return <div style={{ padding: 16 }}>No items found.</div>;
  }

  return (
    <div className={styles?.grid ?? ''} style={{ display: 'grid', gap: 24 }}>
      {challenges.map((item, index) => {
        const key = keyFromId(item._id, String(index));
        const title = item.title ?? 'Untitled';
        const href = item.url ?? '#';

        return (
          <article
            key={key}
            className={styles?.card ?? ''}
            style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}
          >
            {item.section && (
              <div
                className={styles?.badge ?? ''}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#f5f5f5',
                  marginBottom: 8,
                }}
              >
                {item.section}
              </div>
            )}

            <h3 className={styles?.title ?? ''} style={{ margin: '8px 0 12px' }}>
              {href && href !== '#' ? (
                <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  {title}
                </a>
              ) : (
                title
              )}
            </h3>

            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.imageAlt || item.title || 'programme image'}
                style={{ width: '100%', maxWidth: 420, borderRadius: 10, display: 'block', marginBottom: 12 }}
                loading="lazy"
              />
            )}

            {item.description && (
              <p style={{ marginBottom: 12, lineHeight: 1.5 }}>{item.description}</p>
            )}

            {href && href !== '#' && (
              <div>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles?.button ?? ''}
                  style={{
                    display: 'inline-block',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    textDecoration: 'none',
                  }}
                >
                  Open programme
                </a>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}