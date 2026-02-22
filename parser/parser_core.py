import pandas as pd
from openbk.utils.extractors import cih
from typing import Any


def parse_pdf_file(file_path: str, year: int) -> dict[str, Any]:
    """
    Runs openbk on a CIH PDF file and returns normalized transactions.

    openbk returns: [beginning_balance, DataFrame]
    DataFrame columns: transaction, debit, credit, date (format: DD/MM)

    Args:
        file_path: path to the PDF file
        year: the year of the statement (e.g. 2025) — provided by the user on upload

    Returns:
      {
        bank: "CIH",
        beginning_balance: float | None,
        transactions: [{ date, description, amount, type, merchant }]
      }
    """
    output = cih(file_path)

    beginning_balance = None
    raw_df = None

    if isinstance(output, list) and len(output) == 2:
        beginning_balance = _safe_float(output[0])
        raw_df = output[1]

    if raw_df is None or not isinstance(raw_df, pd.DataFrame) or raw_df.empty:
        return {
            "bank":              "CIH",
            "beginning_balance": beginning_balance,
            "transactions":      [],
        }

    transactions = []
    for _, row in raw_df.iterrows():
        debit  = _safe_float(row.get("debit"))
        credit = _safe_float(row.get("credit"))

        if debit and debit > 0:
            amount  = debit
            tx_type = "debit"
        elif credit and credit > 0:
            amount  = credit
            tx_type = "credit"
        else:
            continue

        date_str = _normalize_date(row.get("date"), year)
        if not date_str:
            continue

        description = str(row.get("transaction", "")).strip()
        if not description:
            continue

        merchant = _extract_merchant(description)

        transactions.append({
            "date":        date_str,
            "description": description,
            "amount":      round(amount, 2),
            "type":        tx_type,
            "merchant":    merchant,
        })

    return {
        "bank":              "CIH",
        "beginning_balance": beginning_balance,
        "transactions":      transactions,
    }


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        f = float(str(value).replace(" ", "").replace(",", "."))
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def _normalize_date(value: Any, year: int) -> str | None:
    if value is None:
        return None
    try:
        s = str(value).strip()
        if "/" in s:
            parts = s.split("/")
            if len(parts) == 2:
                day, month = parts
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        ts = pd.to_datetime(s, dayfirst=True)
        return ts.strftime("%Y-%m-%d")
    except Exception:
        return None


def _extract_merchant(description: str) -> str | None:
    if not description:
        return None

    desc = description.upper().strip()

    if any(k in desc for k in ["RETRAIT GAB", "RETRAIT CARTE", "RETRAIT DAB", "FRAIS RETRAIT"]):
        return "ATM"

    if "COMMISSION VIREMENT" in desc:
        return "BANK FEES"

    if any(k in desc for k in ["VIREMENT RECU", "VIREMENT EMIS", "VIREMENT INSTANTANE"]):
        return None

    if "CIHMOBILEBILLING" in desc or "RECHARGE" in desc:
        if "MAROC T L COM" in desc or "MAROC TELECOM" in desc:
            return "MAROC TELECOM"
        if "INWI" in desc:
            return "INWI"
        if "ORANGE" in desc:
            return "ORANGE"
        if "AUTOROUTES" in desc or "ADM" in desc:
            return "AUTOROUTES DU MAROC"
        if "AMENDIS" in desc:
            return "AMENDIS"

    if "PAIEMENT FACTURE" in desc:
        after = desc.replace("PAIEMENT FACTURE", "").strip()
        for known in ["AMENDIS", "INWI", "IAM", "ORANGE", "LYDEC", "RADEEF", "ONEE"]:
            if known in after:
                return known
        first = after.split()[0] if after.split() else None
        return first

    for pattern in [
        "PAIEMENT PAR CARTE 2647 ",
        "PAIEMENT INTERNET INTERNATIONAL CARTE2647 ",
        "PAIEMENT INTERNET NATIONAL CARTE 2647 ",
        "PAIEMENT INTERNET INTERNATIONAL CARTE 2647 ",
        "ACHAT CB ",
    ]:
        if pattern in desc:
            after = desc[desc.index(pattern) + len(pattern):].strip()
            if not after:
                continue
            known_merchants = {
                "MARJANE":    "MARJANE",
                "CARREFOUR":  "CARREFOUR",
                "GLOVO":      "GLOVO",
                "GLOVOAPP":   "GLOVO",
                "APPLE":      "APPLE",
                "OPENAI":     "OPENAI",
                "MCDO":       "MCDONALD'S",
                "SHELL":      "SHELL",
                "TOTAL":      "TOTAL",
                "NETFLIX":    "NETFLIX",
                "SPOTIFY":    "SPOTIFY",
                "PULL BEAR":  "PULL & BEAR",
                "DEFACTO":    "DEFACTO",
                "ZARA":       "ZARA",
                "PHARMACIE":  "PHARMACIE",
                "AFRIQ MARJ": "MARJANE",
                "CROON":      "CROON",
                "OSN":        "OSN",
            }
            for key, val in known_merchants.items():
                if after.startswith(key):
                    return val
            words = after.split()
            merchant = words[0] if words else None
            if merchant and len(merchant) > 2:
                return merchant.title()
            elif len(words) > 1:
                return f"{words[0]} {words[1]}".title()
            return merchant

    return None