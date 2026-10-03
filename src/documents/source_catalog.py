OFFICIAL_SOURCE_URLS: dict[str, str] = {
    "daa-1139_qd-dhcntt_20-12-2022_to_chuc_thi_cac_mon_hoc_he_dai_hoc_chinh_quy.pdf": (
        "https://student.uit.edu.vn/sites/daa/files/202309/"
        "1139_qd-dhcntt_20-12-2022_to_chuc_thi_cac_mon_hoc_he_dai_hoc_chinh_quy.pdf"
    ),
    "daa-135-qd-dhcntt_10-02-2026_quy_dinh_ve_to_chuc_thi_tren_may_tinh_0.pdf": (
        "https://student.uit.edu.vn/sites/daa/files/202602/"
        "135-qd-dhcntt_10-02-2026_quy_dinh_ve_to_chuc_thi_tren_may_tinh_0.pdf"
    ),
    "daa-159-qd-dhcntt_05-03-2024_ban_hanh_quy_dinh_kltn.pdf": (
        "https://student.uit.edu.vn/sites/daa/files/202410/"
        "159-qd-dhcntt_05-03-2024_ban_hanh_quy_dinh_kltn.pdf"
    ),
    "daa-43-2019-qh14_luat_giao_duc.pdf": (
        "https://chinhphu.vn/?classid=1&docid=197310&pageid=27160&typegroupid=3"
    ),
    "daa-790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf": (
        "https://student.uit.edu.vn/sites/daa/files/202309/"
        "790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf"
    ),
    "sdh-503_qd_dhcntt_10_08_2017.pdf": (
        "https://sdh.uit.edu.vn/sites/default/files/201708/503_qd_dhcntt_10_08_2017.pdf"
    ),
    "sdh-77_qd_dhcntt-_dtsdh-_quyche-dths-uit-2014.pdf": (
        "https://sdh.uit.edu.vn/sites/default/files/201501/"
        "77_qd_dhcntt-_dtsdh-_quyche-dths-uit-2014.pdf"
    ),
}


def official_source_url(source_file: str) -> str | None:
    return OFFICIAL_SOURCE_URLS.get(source_file.casefold())
