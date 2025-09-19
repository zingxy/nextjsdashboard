'use server';

/*
server functions
*/
import * as z from 'zod';
import { deleteInvoiceByIdSQL, insertInvoiceSQL, updateInvoiceByIdSQL } from './db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const FormDataSchema = z.object({
  id: z.string(),
  customerId: z.string().min(1),
  amount: z.coerce.number().min(1),
  status: z.enum(['paid', 'pending']),
  date: z.string(),
});
const CreateInvoice = FormDataSchema.omit({ id: true, date: true });
// 插入一条新的 invoice 记录
export async function createInvoiceAction(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  const { amount, customerId, status } = CreateInvoice.parse(rawFormData);
  await insertInvoiceSQL({
    customer_id: customerId,
    amount,
    status,
    date: new Date().toISOString(),
  });
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoiceAction(
  invoiceId: string,
  formData: FormData
) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  const { amount, customerId, status } = CreateInvoice.parse(rawFormData);
  await updateInvoiceByIdSQL(invoiceId, {
    customer_id: customerId,
    amount,
    status,
    date: new Date().toISOString(),
  });
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoiceAction(invoiceId: string) {
  await deleteInvoiceByIdSQL(invoiceId);
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}