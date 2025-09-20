'use server';

/*
server functions
*/
import * as z from 'zod';
import {
  deleteInvoiceByIdSQL,
  insertInvoiceSQL,
  updateInvoiceByIdSQL,
} from './db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// 插入一条新的 invoice 记录
export async function createInvoiceAction(
  prevState: State,
  formData: FormData
) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.error('Create Invoice Validation Error:', validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await insertInvoiceSQL({
      customer_id: customerId,
      amount: amountInCents,
      status,
      date,
    });
  } catch (error) {
    // If a database error occurs, return a more specific error.
    console.error('Create Invoice Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoiceAction(
  invoiceId: string,
  formData: FormData
) {
  try {
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
  } catch (error) {
    console.error('Update Invoice Error:', error);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoiceAction(invoiceId: string) {
  throw new Error('Testing error handling in server action');
  try {
    await deleteInvoiceByIdSQL(invoiceId);
  } catch (error) {
    console.error('Delete Invoice Error:', error);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function authenticateAction(
  state: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
