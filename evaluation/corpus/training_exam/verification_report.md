# Authority Verification Report

Date: 2026-08-27  
Corpus: `training_exam` v1.0.0

## Verified from official UIT sources and normalized text

- `daa-790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf` is the 790/QD-DHCNTT credit-based training regulation. The official UIT page publishes the document and current UIT program pages still cite it as a training basis.
- `cap-nhat-quy-che-dao-tao-tin-chi-1393-2023.pdf` is 1393/QD-DHCNTT dated 2023-12-29 and explicitly updates the 790 regulation. OCR misread the number as 423; the official UIT attachment filename and current UIT program pages confirm 1393.
- `daa-1139_qd-dhcntt_20-12-2022_to_chuc_thi_cac_mon_hoc_he_dai_hoc_chinh_quy.pdf` is 1139/QD-DHCNTT and is published by the official UIT training portal.
- `daa-1376_qd-dhcntt_28-12-2023_cap_nhat_quy_dinh_to_chuc_thi.pdf` is 1376/QD-DHCNTT dated 2023-12-28. The official attachment filename identifies it, its content amends 1139 and the later 425 regulation cites both 1139 and 1376.
- `daa-135-qd-dhcntt_10-02-2026_quy_dinh_ve_to_chuc_thi_tren_may_tinh_0.pdf` contains 425/QD-DHCNTT dated 2026-02-10. It is a specialized rule for computer-based examinations.
- `quy-trinh-to-chuc-thi-quan-ly-diem-bai-thi.pdf` is an operational examination/grade-management procedure issued with 27/QD-DHCNTT-DTDH.
- `daa-803-qd-dhcntt_11-07-2025_quy_trinh_xlhv.pdf` is the official academic-status processing procedure published by UIT.

## Remaining manual checks

1. Confirm whether the older operational procedure `27/QD-DHCNTT-DTDH` remains current or has been superseded. It is excluded from benchmark retrieval and ground truth until then.
2. Keep the exact amended provisions of 1393 and 1376 attached to each benchmark answer that depends on them.
3. Record applicable cohort, regular/distance-learning system and examination modality for each QA sample.

Do not use the unresolved operational procedure as final ground truth until its status is confirmed. The benchmark manifest marks it `benchmark_eligible=false`; the other records may be used according to their explicit scope and amendment relations.
