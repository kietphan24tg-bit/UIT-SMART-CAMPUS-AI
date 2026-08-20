from __future__ import annotations

from enum import Enum


class ToolOperation(str, Enum):
    READ = "read"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    PAYMENT = "payment"
    EMERGENCY = "emergency"
