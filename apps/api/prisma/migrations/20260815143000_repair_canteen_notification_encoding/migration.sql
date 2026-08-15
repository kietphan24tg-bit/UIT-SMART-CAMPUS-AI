UPDATE "notifications"
SET
  "title" = 'Đơn canteen đã thanh toán',
  "body" = 'Thanh toán đơn hàng canteen thành công.'
WHERE "type" = 'canteen'
  AND "data" ->> 'status' = 'paid'
  AND "data" ? 'orderId'
  -- Match only the exact legacy mojibake bytes without embedding control characters in SQL.
  AND encode(convert_to("title", 'UTF8'), 'hex') =
    'c384c290c386c2a16e2063616e7465656e20c384e28098c383c2a3207468616e6820746fc383c2a16e'
  AND encode(convert_to("body", 'UTF8'), 'hex') =
    '5468616e6820746fc383c2a16e20c384e28098c386c2a16e2068c383c2a06e672063616e7465656e207468c383c2a06e682063c383c2b46e672e';
