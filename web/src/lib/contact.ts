/*
 * Office contact details shown on the Contact page and in the footer.
 * These are set here rather than read from Site Settings in the admin.
 */
export const OFFICE_ADDRESS = `JIH Women's Wing Kerala
Hira Centre,
P. B No: 833
Mavoor Road, Near RP Mall
Calicut 4 - 673004`;
export const OFFICE_PHONE = '+91 9037406335';
export const OFFICE_EMAIL = 'jihwomenkerala@gmail.com';

/** tel: link for a displayed number */
export const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`;
