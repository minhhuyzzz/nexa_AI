import { redirect } from 'next/navigation';

export default async function OrderCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  redirect(`/personal/checkout?orderId=${orderId}`);
}
