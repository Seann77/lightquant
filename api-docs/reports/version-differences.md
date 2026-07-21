# PTrade 版本差异入口

国金版标记为 primary，申万版标记为 supplementary。申万版仅作为补充和差异核对入口；本阶段未用申万定义覆盖国金接口定义。

## 页面级统计

- guojin_page_count: 3
- shenwan_page_count: 17
- extracted_api_name_count_guojin: 307
- extracted_api_name_count_shenwan: 299
- common_api_name_count: 273

## 国金独有候选接口名

- False
- XBHS
- __init__
- __new__
- business_count
- com
- daily
- email_address
- email_subject
- end_trade_date
- exchange_type
- get_change_to_backward
- get_change_to_forward
- get_market_value
- hq_type_code
- isoweekday
- key
- log
- occur_balance
- prod_code
- prod_name
- settlement
- smtp_code
- start_trade_date
- tick
- tick_size
- trade_mins
- trade_time_rule
- trans_direction
- transaction
- user_path
- xxx
- SPD
- SRAM

## 申万独有候选接口名

- eval
- License
- init
- new
- abs
- count
- cov
- max
- prod
- python
- sum
- var
- neeq_ipo_stocks_order
- get_block_info
- format
- monetary_fund_purchase_redemption
- get_hks_enable_amount
- get_kline_by_offset
- get_kline_by_range
- hks_cancel_order
- get_EMA
- get_MA
- aggregate_auction_func
- func
- get_MA_day
- entrust_reference

## 差异核对入口

- 国金主接口: raw/ptrade/guojin/ptradeapi.html
- 国金财务数据: raw/ptrade/guojin/财务数据api.html
- 国金行业概念: raw/ptrade/guojin/行业概念分类.html
- 申万接口清单: raw/ptrade/shenwan/06_api_list.html
- 申万系统接口: raw/ptrade/shenwan/07_api_system.html
- 申万数据接口: raw/ptrade/shenwan/08_api_data.html
- 申万交易接口: raw/ptrade/shenwan/09_api_trade.html

