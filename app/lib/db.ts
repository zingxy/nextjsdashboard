import postgres from 'postgres';
import { Invoice } from './definitions';

export const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export const insertInvoiceSQL = (invoice: Omit<Invoice, 'id'>) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `;

export const updateInvoiceByIdSQL = (
  id: string,
  invoice: Omit<Invoice, 'id'>
) => {
  return sql`
    UPDATE invoices
    SET customer_id = ${invoice.customer_id}, amount = ${invoice.amount}, status = ${invoice.status}
    WHERE id = ${id};
  `;
};

export const deleteInvoiceByIdSQL = (id: string) => {
  return sql`
    DELETE FROM invoices
    WHERE id = ${id};
  `;
};
