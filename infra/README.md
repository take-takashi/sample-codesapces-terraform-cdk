# Preparation

- Github の Codespaces secrets に以下のシークレットを追加
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY

# How to use

```
cd infra/

# 初回限定
cdktf init

# 変更をみる
cdktf plan

# 適用
cdktf apply

# 削除
cdktf destroy
``
```
