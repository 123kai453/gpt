-- FITNESS_OS_REMOTE_AUDIT_V2_BEGIN
-- PostgreSQL 17 metadata audit; read the review and confirm Dashboard identity first.
-- Project Ref below is expected context, NOT proof of database/project ownership.
-- No application/auth/session/storage-object rows, passwords or file names are read.
-- No business RPC. Optional sources use fixed, guarded metadata SELECTs only.
-- Function/view/trigger code is withheld. Other expressions use reviewed SHA256 allowlist.
-- Inspect truncated/status fields; a valid JSON object does NOT mean a complete audit.
-- Execute the ENTIRE file. Verify downloaded bytes/SHA256 against SHA256SUMS.txt.
BEGIN READ ONLY;

SET LOCAL statement_timeout TO '30s';

SET LOCAL lock_timeout TO '3s';

SET LOCAL idle_in_transaction_session_timeout TO '60s';

SET LOCAL search_path TO 'pg_catalog';

SET LOCAL standard_conforming_strings TO 'on';

WITH reviewed_expression_hashes(sha256) AS (
       VALUES ('007604a273ca48e39a1ef9971f5d2701e880a861bba3b04d54699e721821e3ca')
            , ('01369f202a00d1fb11685e02d3d328443a8c82f8a24c611530461b6b0112bd7b')
            , ('0263d92ff61395191491dafd7d19e0c23d4d3cc4d0db641ef6419c3a76e119cf')
            , ('0551abd89f73780f86fd9eeb166e155d4be8096b953b21393f20c376fe65a9e3')
            , ('06d9b98ed2a8d6bd3805ebd63ec2975685952f5fded6c6698b6caad002a61af3')
            , ('07b5c4fc82df6ebdcb620bd5d5e214f6049caa0408eb6c0d0a5183d0cc55bc50')
            , ('0a1ed9042c252d666501138dcd84e6d7b7d880a449972989ec28895e773b57dc')
            , ('0b3ff6732bc69b36ec7bbd9063779077f2ec578d6b89ccf5fd81aa1f683e9e06')
            , ('0d8f232a20234f44e8d753f28e4b49c2756368729cbc3035554de66c8fc8f027')
            , ('0dca30455901a4192bfe358cdc7d86c5ebe1c9a0a0428f7a5cda2308dc63dc27')
            , ('0f000d395fd2e9dcbb46527dfc1f5d2fe8a881fbec450feef7d63ebc1989dd2d')
            , ('19a1fc0ee996bfd359bc12ac57404ba82ce62466f1f467660dd3421c574a7930')
            , ('1a85bef26b81ba7e9f9f193433b45fefd96d1cc2b948f5bed59373aec8e9ad54')
            , ('1b29cc1f6c0017f447260789db013ce3e4e626934472e2d6330af3984baee68b')
            , ('1efc4225a38b533e45e2769831fce4bee8de677c5dd7b611e4d0b9edeaf87294')
            , ('248eaa8d9ad55df13054ec6dad3a08495c4ae6534cad1099eea8e223f80d8c7d')
            , ('26dc3f171b67223572eda7b9d3e0d4f813ac37882033f1b5b6670b31c7edf740')
            , ('288f5a489eaf3c96c0c1b9e769238a8d4c04775e4a4bf2a2849df82947e096f1')
            , ('28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f')
            , ('36f0a77c23bf8dd624a982753a8dd2568fbdcf3a4529d790bface41b9b5e3dc7')
            , ('44756d887704fc88d8d0adc5c0c431103c555b4f8e6a4ddef6f7a7f6b4110606')
            , ('465e7ba2b7715e69c0e0b45f365d8767283687aef1e384664e15d3b028e2e1db')
            , ('46a725f44133dbe8ac53cee054884b7136bbb4c3c9d612fbb3f55e171387f97b')
            , ('4750cc1af63ee97bcc6cf6015039c107b8637d0d3ec85e4e518e6524c5e8a8c6')
            , ('48b84dff05b58b6225c6ef7aa9e373182350ae3d873f196d6a4f7e548ffccb7e')
            , ('49a9a7518a82707ea3ab61e835192372f62b11afdaa7e064d0ecfea70d61b870')
            , ('4b1d66350efe3913ebc4851cda50bbd44dd30a5f59bafb1c24c2edec4301816e')
            , ('4b58e148566260076d381214bee63b6fdbff32448efe47dc351d7d898b0925d8')
            , ('4bf6dab41e71a6f2a2896dc480022cca301112cbef30a76780fdeff16c5b0ba8')
            , ('4d7b8c88dc336a09d46cb5043e12cb0b16ac35ebc2b7df0a3f165cee1624a77f')
            , ('4fc4cb868d6834fed1f804984857e1a45c646a9bbdec6132d7ef24152eddd4d4')
            , ('53b7a86a93f63ce87d6f729ac998171098e9b2acbe3d45cda921f2642ea9c601')
            , ('557d72f08f38d9d6014bacc208de7377172a8e0dbb9b591809320c2d85572d23')
            , ('57995f61af24cdcfd673338873db45ecffd012e2f406992e30a09cb931a7c6d5')
            , ('5a306dfcc8ff0bb87c6fce23d0d199a621c2d3de828233a09119121a90319694')
            , ('5f774b77e5a59dec588bb28ea99445e9bc6cfecca0b6274de77ffbfc5c3e57c8')
            , ('5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9')
            , ('626e2df2176d30ba89a8269dcaf74332e1a183233bd4d91d09fa1b16bde09b5a')
            , ('6692ecd8b05767fbcd498d32ddb049861dbfb5a0da0c87f231a9cf9d3082222f')
            , ('66d26aa642d758d486b2849d290ff80dd627ba22c613f096e5b581671f563f61')
            , ('676219f025870b893c0df8670464cfdae5f5cc073c6c44841e35f1805c6b81ce')
            , ('6b2992ada121975689e02b4e162c41374be6c440c8eaed2447cbf915b470f42a')
            , ('6b29c55e566d97b19eceb57b3de94a42e99300dad4fc3228b1f7903b550becf4')
            , ('6b549e57acfb4d7b0c6972c332b69c64e43deff7159e9922e2488c1f1fc2c192')
            , ('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b')
            , ('6ca7d4b44819dee9635fa86ca6f49bf152903fbbd5a2ff2c0fc4c4f0c3c3e5c8')
            , ('6ee9c3eebaa139a9da2a5a8b8ec90549d1fc36595d6f38c754f65831d0372f93')
            , ('715ecfec6e7583cca72ecba254afba3a1743d78a64cadf4d05de46ba4d49bbae')
            , ('75adc4cd3a6eb60d1c2ae35b76b6d5ee220894e2bc5226058a6a73b61a32bb2b')
            , ('795fe023ab094b5ed118e035257a96990b65f3ad741e7ccfe91283634e1830a9')
            , ('79a5b2dc2d096ffb39994a845023a10b09fb119f3f0c3e9d7d103ebf5c1b3a7b')
            , ('79d73f5cebbe6c19dca63a8c137158712c447b59ea705adb7b189c0d80ecc6cf')
            , ('7b57a91ef8796675f24340b9ddd1ef66347ca8cd012feee53430b5c149dfbfea')
            , ('7b73ed0ea136131dbd349d3c48b7ddb6b3f85532d765f31b418ea315fc6ef0e9')
            , ('7bae5e355e1887ccfd39ef9956bbf61830ae3ddfc8fe194f52b0571adc084745')
            , ('7c78aca2f7b5196d790051aff5f7fed5882c84b9b28ecd088ef34c78a0acdcc3')
            , ('7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a')
            , ('7ea8bce2e09e3a356e277211280150ba636f2c6735a39082380322fde72ca1f1')
            , ('8001f2ba79d7ee0ed7c18f82705408c75c1e6f9ac6859477febdad7f5599c099')
            , ('8108b85ffa2bc5856ad4e8abf181269f88d74074f7977d3668e2683e63e5cf5e')
            , ('84aaeb21178ee70618f75669b8430a151e25bc8e3d768a42e9a98324594eff61')
            , ('8688cf8f43f94f36e640f011e3f7facf33a00ae3eea09264de8097f28106e1b9')
            , ('87bdafbaf38aac759fbbbfccf21aaca287eed365ae469f8472f76ed87d04260d')
            , ('89353449629d82f85a476e1ca7617285ced98013629d34ab0c1782443da44544')
            , ('8c8464f42472e42ee190fc91ca8db79b5351d3a4609040516578d229c56f6fa5')
            , ('920ae8964c92809cc245af127c023cae1845a9c4687d65231d62d9de344297d7')
            , ('98c65e3a9ac2cbd3bb6dae2fcd4a7ed2e2758e6d07f3707aaec086b45e0ee7f5')
            , ('9a549c3ac965d9f0451d14352a01b6666992879223e48e22e80b151be513f668')
            , ('9eb456c7d1649f23c6e8b3c528d86d66e94e068b22297290f6dfda7207ef6c0f')
            , ('9ec2418d02ad8d3aff3555ed426b71befbc4fcb332f1c4d461ec8efcec1151e9')
            , ('9f5a2d58907f19b75183c544adcc30854aaab4f0bac2ae34f66fa885801610e9')
            , ('a10c74d0768e3c72dad66b837b9126605d50820b0715aa0c7b9548c1bf7e01fd')
            , ('a698e6cf1267a67da899cfcb3849cfa2a4ba181c2a3d0e15a7d289cca5164702')
            , ('a89df8d14a00b7bd2ead7e86414dcd5232bff306786856171b38584e153bb73f')
            , ('aabcd7e0e9d0529fe5adc52db977198bdbb9d76789a9ddbc0f69c14658e90a3a')
            , ('ae41208f4f86e7623129bbacc63b5bec9c06f0b57c0e06371441fb96b0abd16a')
            , ('b07ab332e0091e7c0ddf854e2912a2696d69f0a230149c3e20971c613affd143')
            , ('b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b')
            , ('bc73cd61d836df257bdcef9fe795be84f615e22e1d7b0ccdc11b347abb0bd296')
            , ('bcbd53f4dccfec1b0af874a69299fea1ba1d820b50808962b44f5c66f2afd9a7')
            , ('bdea1cbc13d5496dd31ec70b5e41f5b8b1224ea438ba188ce5b10d6940fb301b')
            , ('be75db44ea66e52612188f139e9d0a510031d5495a42c74f39e76f0b9cab5e7c')
            , ('bee96bfe0fbff4e3562d3415fea88f4b9e9b3c8eb826bc5a83b1f0d6d04a58c3')
            , ('c33ad23ec49f404f08d70218a028295bfd694658e73da105d56b940ad6256a82')
            , ('c5b63a6215ad1e62d7eca2d6b1984316bcd960ce5300988ce5e386cb9a916777')
            , ('c5c0482ed1c11cf29f552ee64034ace9c0357570b0be1775eba6cf417f44413a')
            , ('cf7a7da6ccd830838b3f0c7a30953cff453eb19886b8ae1201357dfd0654c9d9')
            , ('d234b2aea4e8dd40276f8f9b8238302e3a0796cc3111fe8c14fc455189a7d970')
            , ('d31af317d0687bb2493a220c7f3db9fd4d4359d769b7feaff3b9667abecb15dd')
            , ('d7c3c249728cc83d62b0fdb1999d4b454e05cf6670bf1d1bf0cdbe2b37e5f678')
            , ('dd7ba6e6629b5fc596622e4c06da5c18f016470c3c3d133b16befae021092d3b')
            , ('e19edefd7f2b5cf7e1395989931f2160203a882bdbc22858876efce54d5b6e91')
            , ('e33d37d801c92ad6cdf672e8e66b686dcaca2db816885375b51ced354167d432')
            , ('ea87bb4ca18680b723cf6ea5c5e86bb2f60a3f00f238acd5c5819dce3b37fbb2')
            , ('ee557b85bcdbc684e0cd5a767a2a5e931372ffb823a29a64690e3ffb9ae64aaa')
            , ('eea9a3e7c2abe43835e2a6fdf92a7d1e6f145ad6dfbfd243fc5d395e5b390a33')
            , ('ef037d6d237ccac62578eb596cee6e16ef5b7ed236150c70cc8ae4a883711473')
            , ('f12714e31c277e7a306f2dbf8d987bafbd6ef0991d0bc2110ac6c20a1ab84e9c')
            , ('f1349016af9f9ef8cb8fa3edf88b8e9fa6f2e2a1c7612cf86d169cf3aa92ba5d')
            , ('f273bcca9f2341620f99bc9b78458959669af317d55412923bbb74870e1614d0')
            , ('f4d3750eef39011dfc60839b1dec94d52af2153e050bf27b512d623ca9997a45')
            , ('f5cb8931f3652c7eac52893dcde5d39f62f51855cb1b5b6656fc817d59535e4f')
            , ('f83563669a3d3008008e0915d49d4163f278b92329e30f4762e92b7521e6442e')
            , ('fa95342de36624fe95a3103e40f5c681223250a7ae3e45c6d0fe10bd98bd50a9')
            , ('fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa')
     )
   , expected_columns(  schema_name, table_name, column_name, expected_type) AS (
       VALUES ('public', 'profiles', 'id', 'uuid')
            , ('public', 'profiles', 'username', 'text')
            , ('public', 'profiles', 'display_name', 'text')
            , ('public', 'profiles', 'avatar_path', 'text')
            , ('public', 'profiles', 'version', 'bigint')
            , ('public', 'profiles', 'created_at', 'timestamp with time zone')
            , ('public', 'profiles', 'updated_at', 'timestamp with time zone')
            , ('public', 'profiles', 'deletion_requested_at', 'timestamp with time zone')
            , ('public', 'user_preferences', 'user_id', 'uuid')
            , ('public', 'user_preferences', 'theme', 'text')
            , ('public', 'user_preferences', 'language', 'text')
            , ('public', 'user_preferences', 'unit_system', 'text')
            , ('public', 'user_preferences', 'timezone', 'text')
            , ('public', 'user_preferences', 'notification_preferences', 'jsonb')
            , ('public', 'user_preferences', 'version', 'bigint')
            , ('public', 'user_preferences', 'created_at', 'timestamp with time zone')
            , ('public', 'user_preferences', 'updated_at', 'timestamp with time zone')
            , ('public', 'user_consents', 'id', 'uuid')
            , ('public', 'user_consents', 'user_id', 'uuid')
            , ('public', 'user_consents', 'scope', 'text')
            , ('public', 'user_consents', 'granted', 'boolean')
            , ('public', 'user_consents', 'policy_version', 'text')
            , ('public', 'user_consents', 'created_at', 'timestamp with time zone')
            , ('public', 'sync_metadata', 'user_id', 'uuid')
            , ('public', 'sync_metadata', 'device_id', 'uuid')
            , ('public', 'sync_metadata', 'last_seen_at', 'timestamp with time zone')
            , ('public', 'sync_metadata', 'last_synced_at', 'timestamp with time zone')
            , ('public', 'user_data_exports', 'id', 'uuid')
            , ('public', 'user_data_exports', 'user_id', 'uuid')
            , ('public', 'user_data_exports', 'format', 'text')
            , ('public', 'user_data_exports', 'status', 'text')
            , ('public', 'user_data_exports', 'object_path', 'text')
            , ('public', 'user_data_exports', 'error_code', 'text')
            , ('public', 'user_data_exports', 'created_at', 'timestamp with time zone')
            , ('public', 'user_data_exports', 'updated_at', 'timestamp with time zone')
            , ('public', 'user_data_exports', 'completed_at', 'timestamp with time zone')
            , ('public', 'user_media', 'id', 'uuid')
            , ('public', 'user_media', 'user_id', 'uuid')
            , ('public', 'user_media', 'object_path', 'text')
            , ('public', 'user_media', 'mime_type', 'text')
            , ('public', 'user_media', 'size_bytes', 'bigint')
            , ('public', 'user_media', 'status', 'text')
            , ('public', 'user_media', 'storage_object_id', 'uuid')
            , ('public', 'user_media', 'storage_object_version', 'text')
            , ('public', 'user_media', 'content_sha256', 'text')
            , ('public', 'user_media', 'verified_at', 'timestamp with time zone')
            , ('public', 'user_media', 'created_at', 'timestamp with time zone')
            , ('public', 'user_media', 'updated_at', 'timestamp with time zone')
            , ('public', 'account_deletion_jobs', 'id', 'uuid')
            , ('public', 'account_deletion_jobs', 'user_id', 'uuid')
            , ('public', 'account_deletion_jobs', 'status', 'text')
            , ('public', 'account_deletion_jobs', 'attempts', 'integer')
            , ('public', 'account_deletion_jobs', 'last_error', 'text')
            , ('public', 'account_deletion_jobs', 'created_at', 'timestamp with time zone')
            , ('public', 'account_deletion_jobs', 'updated_at', 'timestamp with time zone')
            , ('public', 'account_deletion_jobs', 'completed_at', 'timestamp with time zone')
            , ('app_private', 'account_mutation_receipts', 'user_id', 'uuid')
            , ('app_private', 'account_mutation_receipts', 'mutation_id', 'uuid')
            , ('app_private', 'account_mutation_receipts', 'request_payload', 'jsonb')
            , ('app_private', 'account_mutation_receipts', 'result', 'jsonb')
            , ('app_private', 'account_mutation_receipts', 'created_at', 'timestamp with time zone')
            , ('app_private', 'rate_limit_counters', 'user_id', 'uuid')
            , ('app_private', 'rate_limit_counters', 'action', 'text')
            , ('app_private', 'rate_limit_counters', 'window_start', 'timestamp with time zone')
            , ('app_private', 'rate_limit_counters', 'count', 'integer')
            , ('app_private', 'media_upload_jobs', 'media_id', 'uuid')
            , ('app_private', 'media_upload_jobs', 'user_id', 'uuid')
            , ('app_private', 'media_upload_jobs', 'request_id', 'uuid')
            , ('app_private', 'media_upload_jobs', 'request_sha256', 'text')
            , ('app_private', 'media_upload_jobs', 'expected_sha256', 'text')
            , ('app_private', 'media_upload_jobs', 'status', 'text')
            , ('app_private', 'media_upload_jobs', 'attempts', 'integer')
            , ('app_private', 'media_upload_jobs', 'lease_token', 'uuid')
            , ('app_private', 'media_upload_jobs', 'lease_until', 'timestamp with time zone')
            , ('app_private', 'media_upload_jobs', 'next_attempt_at', 'timestamp with time zone')
            , ('app_private', 'media_upload_jobs', 'io_pending', 'boolean')
            , ('app_private', 'media_upload_jobs', 'io_token', 'uuid')
            , ('app_private', 'media_upload_jobs', 'io_bucket', 'text')
            , ('app_private', 'media_upload_jobs', 'io_started_at', 'timestamp with time zone')
            , ('app_private', 'media_upload_jobs', 'phase', 'text')
            , ('app_private', 'media_upload_jobs', 'last_error', 'text')
            , ('app_private', 'media_upload_jobs', 'created_at', 'timestamp with time zone')
            , ('app_private', 'media_upload_jobs', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'media_job_events', 'id', 'bigint')
            , ('app_private', 'media_job_events', 'media_id', 'uuid')
            , ('app_private', 'media_job_events', 'user_id', 'uuid')
            , ('app_private', 'media_job_events', 'event', 'text')
            , ('app_private', 'media_job_events', 'code', 'text')
            , ('app_private', 'media_job_events', 'observed_at', 'timestamp with time zone')
            , ('app_private', 'media_orphan_claims', 'bucket_id', 'text')
            , ('app_private', 'media_orphan_claims', 'object_path', 'text')
            , ('app_private', 'media_orphan_claims', 'object_id', 'uuid')
            , ('app_private', 'media_orphan_claims', 'object_version', 'text')
            , ('app_private', 'media_orphan_claims', 'lease_token', 'uuid')
            , ('app_private', 'media_orphan_claims', 'lease_until', 'timestamp with time zone')
            , ('app_private', 'media_orphan_claims', 'attempts', 'integer')
            , ('app_private', 'media_orphan_claims', 'next_attempt_at', 'timestamp with time zone')
            , ('app_private', 'media_orphan_claims', 'last_error', 'text')
            , ('app_private', 'media_orphan_claims', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'media_maintenance_state', 'name', 'text')
            , ('app_private', 'media_maintenance_state', 'cursor_id', 'uuid')
            , ('app_private', 'media_maintenance_state', 'revision', 'bigint')
            , ('app_private', 'media_maintenance_state', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'account_cleanup_authorizations', 'user_id', 'uuid')
            , ('app_private', 'account_cleanup_authorizations', 'job_id', 'uuid')
            , ('app_private', 'account_cleanup_authorizations', 'authorized_at', 'timestamp with time zone')
            , ('app_private', 'account_cleanup_authorizations', 'expires_at', 'timestamp with time zone')
            , ('app_private', 'account_cleanup_authorizations', 'attempts', 'integer')
            , ('app_private', 'account_cleanup_authorizations', 'lease_token', 'uuid')
            , ('app_private', 'account_cleanup_authorizations', 'lease_until', 'timestamp with time zone')
            , ('app_private', 'account_cleanup_authorizations', 'next_attempt_at', 'timestamp with time zone')
            , ('app_private', 'account_cleanup_authorizations', 'last_error', 'text')
            , ('app_private', 'account_cleanup_authorizations', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'brand_admin_members', 'user_id', 'uuid')
            , ('app_private', 'brand_admin_members', 'active', 'boolean')
            , ('app_private', 'brand_admin_members', 'created_at', 'timestamp with time zone')
            , ('app_private', 'brand_admin_members', 'assigned_by', 'text')
            , ('app_private', 'brand_assets', 'id', 'uuid')
            , ('app_private', 'brand_assets', 'created_by', 'uuid')
            , ('app_private', 'brand_assets', 'updated_by', 'uuid')
            , ('app_private', 'brand_assets', 'request_id', 'uuid')
            , ('app_private', 'brand_assets', 'request_sha256', 'text')
            , ('app_private', 'brand_assets', 'original_sha256', 'text')
            , ('app_private', 'brand_assets', 'original_mime', 'text')
            , ('app_private', 'brand_assets', 'sha256', 'text')
            , ('app_private', 'brand_assets', 'mime_type', 'text')
            , ('app_private', 'brand_assets', 'size_bytes', 'bigint')
            , ('app_private', 'brand_assets', 'width', 'integer')
            , ('app_private', 'brand_assets', 'height', 'integer')
            , ('app_private', 'brand_assets', 'state', 'text')
            , ('app_private', 'brand_assets', 'object_path', 'text')
            , ('app_private', 'brand_assets', 'object_id', 'uuid')
            , ('app_private', 'brand_assets', 'object_version', 'text')
            , ('app_private', 'brand_assets', 'write_token', 'uuid')
            , ('app_private', 'brand_assets', 'write_pending', 'boolean')
            , ('app_private', 'brand_assets', 'last_error', 'text')
            , ('app_private', 'brand_assets', 'alt', 'text')
            , ('app_private', 'brand_assets', 'source', 'text')
            , ('app_private', 'brand_assets', 'license', 'text')
            , ('app_private', 'brand_assets', 'usage', 'text')
            , ('app_private', 'brand_assets', 'sort_order', 'integer')
            , ('app_private', 'brand_assets', 'replaces_id', 'uuid')
            , ('app_private', 'brand_assets', 'version', 'bigint')
            , ('app_private', 'brand_assets', 'created_at', 'timestamp with time zone')
            , ('app_private', 'brand_assets', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'brand_content_items', 'id', 'uuid')
            , ('app_private', 'brand_content_items', 'position', 'text')
            , ('app_private', 'brand_content_items', 'sort_order', 'integer')
            , ('app_private', 'brand_content_items', 'status', 'text')
            , ('app_private', 'brand_content_items', 'draft', 'jsonb')
            , ('app_private', 'brand_content_items', 'draft_asset_id', 'uuid')
            , ('app_private', 'brand_content_items', 'published', 'jsonb')
            , ('app_private', 'brand_content_items', 'published_asset_id', 'uuid')
            , ('app_private', 'brand_content_items', 'published_position', 'text')
            , ('app_private', 'brand_content_items', 'published_sort_order', 'integer')
            , ('app_private', 'brand_content_items', 'published_at', 'timestamp with time zone')
            , ('app_private', 'brand_content_items', 'created_by', 'uuid')
            , ('app_private', 'brand_content_items', 'updated_by', 'uuid')
            , ('app_private', 'brand_content_items', 'created_at', 'timestamp with time zone')
            , ('app_private', 'brand_content_items', 'updated_at', 'timestamp with time zone')
            , ('app_private', 'brand_content_items', 'version', 'bigint')
            , ('app_private', 'brand_content_events', 'id', 'uuid')
            , ('app_private', 'brand_content_events', 'actor_id', 'uuid')
            , ('app_private', 'brand_content_events', 'entity_id', 'uuid')
            , ('app_private', 'brand_content_events', 'action', 'text')
            , ('app_private', 'brand_content_events', 'detail', 'jsonb')
            , ('app_private', 'brand_content_events', 'created_at', 'timestamp with time zone')
            , ('app_private', 'brand_mutation_receipts', 'actor_id', 'uuid')
            , ('app_private', 'brand_mutation_receipts', 'request_id', 'uuid')
            , ('app_private', 'brand_mutation_receipts', 'fingerprint', 'text')
            , ('app_private', 'brand_mutation_receipts', 'response', 'jsonb')
            , ('app_private', 'brand_mutation_receipts', 'created_at', 'timestamp with time zone')
            , ('app_private', 'brand_request_limits', 'actor_id', 'uuid')
            , ('app_private', 'brand_request_limits', 'window_started', 'timestamp with time zone')
            , ('app_private', 'brand_request_limits', 'hits', 'integer')
     )
   , wanted_schemas(schema_name) AS (
       VALUES ('public')
            , ('app_private')
            , ('supabase_migrations')
            , ('auth')
            , ('storage')
     )
   , expected_tables(  schema_name, table_name) AS (
       VALUES ('public', 'profiles')
            , ('public', 'user_preferences')
            , ('public', 'user_consents')
            , ('public', 'sync_metadata')
            , ('public', 'user_data_exports')
            , ('public', 'user_media')
            , ('public', 'account_deletion_jobs')
            , ('app_private', 'account_mutation_receipts')
            , ('app_private', 'rate_limit_counters')
            , ('app_private', 'media_upload_jobs')
            , ('app_private', 'media_job_events')
            , ('app_private', 'media_orphan_claims')
            , ('app_private', 'media_maintenance_state')
            , ('app_private', 'account_cleanup_authorizations')
            , ('app_private', 'brand_admin_members')
            , ('app_private', 'brand_assets')
            , ('app_private', 'brand_content_items')
            , ('app_private', 'brand_content_events')
            , ('app_private', 'brand_mutation_receipts')
            , ('app_private', 'brand_request_limits')
     )
   , expected_functions(  schema_name, function_name) AS (
       VALUES ('public', 'has_current_auth_session')
            , ('public', 'is_current_account_active')
            , ('app_private', 'guard_owned_resource')
            , ('app_private', 'clear_removed_avatar')
            , ('app_private', 'create_account_defaults')
            , ('public', 'consume_account_rate_limit')
            , ('public', 'apply_account_mutation')
            , ('public', 'request_account_deletion')
            , ('public', 'server_media_write')
            , ('public', 'server_export_write')
            , ('public', 'server_deletion_progress')
            , ('app_private', 'media_event')
            , ('public', 'server_media_reliability')
            , ('app_private', 'media_storage_guard')
            , ('app_private', 'media_auth_delete_guard')
            , ('public', 'brand_admin_context')
            , ('public', 'brand_public_content')
            , ('public', 'server_brand_command')
            , ('app_private', 'brand_storage_guard')
     )
   , api_roles AS (
       SELECT oid
            , rolname
       FROM pg_catalog.pg_roles
       WHERE rolname IN ('anon', 'authenticated', 'service_role')
     )
   , custom_schemas AS (
       SELECT n.oid
            , n.nspname
            , n.nspowner
            , n.nspacl
       FROM pg_catalog.pg_namespace AS n
       WHERE n.nspname !~ '^pg_'
         AND n.nspname <> 'information_schema'
     )
   , application_schemas AS (
       SELECT *
       FROM custom_schemas
       WHERE nspname IN ('public', 'app_private', 'supabase_migrations')
          OR nspname NOT IN ('auth', 'storage', 'realtime', 'extensions', 'graphql', 'graphql_public', 'vault', 'supabase_functions', 'net', '_analytics', '_realtime', 'pgsodium', 'pgsodium_masks', 'pgtle')
     )
   , relations AS (
       SELECT c.*
            , n.nspname
       FROM pg_catalog.pg_class AS c
            INNER JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
       WHERE c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
         AND (n.oid IN (SELECT oid
                        FROM application_schemas)
           OR n.nspname IN ('auth', 'storage'))
     )
   , triggers AS (
       SELECT t.*
            , r.nspname
            , r.relname
       FROM pg_catalog.pg_trigger AS t
            INNER JOIN relations AS r ON r.oid = t.tgrelid
       WHERE NOT t.tgisinternal
     )
   , functions AS (
       SELECT p.*
            , n.nspname
       FROM pg_catalog.pg_proc AS p
            INNER JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
       WHERE p.prokind IN ('f', 'p')
         AND ((n.oid IN (SELECT oid
                         FROM application_schemas)
           AND NOT EXISTS (SELECT 1
                           FROM pg_catalog.pg_depend AS d
                           WHERE d.classid = CAST('pg_catalog.pg_proc' AS regclass)
                             AND d.objid = p.oid
                             AND d.deptype = 'e'))
           OR p.oid IN (SELECT tgfoid
                        FROM triggers)
           OR (n.nspname = 'auth'
           AND p.proname IN ('uid', 'jwt')
           AND p.pronargs = 0)
           OR (n.nspname = 'storage'
           AND p.proname = 'foldername'
           AND p.proargtypes = CAST('25' AS pg_catalog.oidvector))
           OR (n.nspname = 'pg_catalog'
           AND p.proname = 'gen_random_uuid'
           AND p.pronargs = 0))
     )
   , ledger AS (
       SELECT c.oid
            , c.relkind
            , c.relrowsecurity
            , c.relforcerowsecurity
            ,     pg_catalog.has_table_privilege(CURRENT_USER
                                               , c.oid
                                               , 'SELECT')
              AND pg_catalog.has_schema_privilege(CURRENT_USER
                                                , c.relnamespace
                                                , 'USAGE') AS can_read
            , EXISTS (SELECT 1
                      FROM pg_catalog.pg_attribute AS a
                      WHERE a.attrelid = c.oid
                        AND a.attname = 'version'
                        AND a.atttypid IN (CAST('text' AS regtype)
                                         , CAST('varchar' AS regtype))
                        AND NOT a.attisdropped) AS version_text_column
            , EXISTS (SELECT 1
                      FROM pg_catalog.pg_attribute AS a
                      WHERE a.attrelid = c.oid
                        AND a.attname = 'name'
                        AND a.atttypid IN (CAST('text' AS regtype)
                                         , CAST('varchar' AS regtype))
                        AND NOT a.attisdropped) AS name_text_column
       FROM pg_catalog.pg_class AS c
       WHERE c.oid = (SELECT oc.oid
                      FROM pg_catalog.pg_class AS oc
                           INNER JOIN pg_catalog.pg_namespace AS ons ON ons.oid = oc.relnamespace
                      WHERE ons.nspname = 'supabase_migrations'
                        AND oc.relname = 'schema_migrations')
     )
   , ledger_xml AS (
       SELECT CASE
                WHEN oid IS NOT NULL
                 AND relkind IN ('r', 'p')
                 AND can_read
                 AND version_text_column
                 AND NOT relrowsecurity
                  THEN pg_catalog.query_to_xml('SELECT version::text AS version, ' || CASE
                                                                                        WHEN name_text_column
                                                                                          THEN 'name::text'
                                                                                        ELSE 'NULL::text'
                                                                                      END || ' AS name FROM supabase_migrations.schema_migrations ORDER BY version::text LIMIT 1001'
                                             , FALSE
                                             , FALSE
                                             , '')
                ELSE CAST(NULL AS xml)
              END AS data
       FROM ledger
     )
   , ledger_rows AS (
       SELECT x.version
            , x.name
       FROM ledger_xml AS l
            CROSS JOIN LATERAL xmltable(('/table/row')
                                        PASSING l.data
                                        COLUMNS version text PATH 'version'
                                              , name text PATH 'name') AS x
     )
   , member_access AS (
       SELECT has_table_privilege(CURRENT_USER
                                , 'pg_catalog.pg_auth_members'
                                , 'SELECT') AS can_read
     )
   , member_xml AS (
       SELECT CASE
                WHEN can_read
                  THEN pg_catalog.query_to_xml('SELECT pg_get_userbyid(roleid)::text AS granted_role,pg_get_userbyid(member)::text AS member_role,pg_get_userbyid(grantor)::text AS grantor,admin_option::text AS admin_option,inherit_option::text AS inherit_option,set_option::text AS set_option FROM pg_catalog.pg_auth_members ORDER BY roleid,member,grantor', FALSE, FALSE, '')
                ELSE CAST(NULL AS xml)
              END AS data
       FROM member_access
     )
   , member_rows AS (
       SELECT x.granted_role
            , x.member_role
            , x.grantor
            , CAST(x.admin_option AS boolean)
            , CAST(x.inherit_option AS boolean)
            , CAST(x.set_option AS boolean)
       FROM member_xml AS m
            CROSS JOIN LATERAL xmltable(('/table/row')
                                        PASSING m.data
                                        COLUMNS granted_role text PATH 'granted_role'
                                              , member_role text PATH 'member_role'
                                              , grantor text PATH 'grantor'
                                              , admin_option text PATH 'admin_option'
                                              , inherit_option text PATH 'inherit_option'
                                              , set_option text PATH 'set_option') AS x
     )
   , bucket_access AS (
       SELECT c.oid
            , c.relkind
            ,     pg_catalog.has_table_privilege(CURRENT_USER
                                               , c.oid
                                               , 'SELECT')
              AND pg_catalog.has_schema_privilege(CURRENT_USER
                                                , c.relnamespace
                                                , 'USAGE') AS can_read
            , NOT pg_catalog.row_security_active(c.oid) AS no_rls_policy_evaluation
            , (SELECT count(*) = 5
               FROM pg_catalog.pg_attribute AS a
               WHERE a.attrelid = c.oid
                 AND NOT a.attisdropped
                 AND ((a.attname IN ('id', 'name')
                   AND a.atttypid IN (CAST('text' AS regtype)
                                    , CAST('varchar' AS regtype)))
                   OR (a.attname = 'public'
                   AND a.atttypid = CAST('bool' AS regtype))
                   OR (a.attname = 'file_size_limit'
                   AND a.atttypid IN (CAST('int8' AS regtype)
                                    , CAST('int4' AS regtype)))
                   OR (a.attname = 'allowed_mime_types'
                   AND a.atttypid = CAST('text[]' AS regtype)))) AS columns_present
       FROM pg_catalog.pg_class AS c
       WHERE c.oid = (SELECT oc.oid
                      FROM pg_catalog.pg_class AS oc
                           INNER JOIN pg_catalog.pg_namespace AS ons ON ons.oid = oc.relnamespace
                      WHERE ons.nspname = 'storage'
                        AND oc.relname = 'buckets')
     )
   , bucket_xml AS (
       SELECT CASE
                WHEN oid IS NOT NULL
                 AND relkind IN ('r', 'p')
                 AND can_read
                 AND columns_present
                 AND no_rls_policy_evaluation
                  THEN pg_catalog.query_to_xml('SELECT id::text AS id,name::text AS name,public::text AS public,file_size_limit::text AS file_size_limit,array_to_json(allowed_mime_types)::text AS allowed_mime_types_json FROM storage.buckets ORDER BY id LIMIT 501', FALSE, FALSE, '')
                ELSE CAST(NULL AS xml)
              END AS data
       FROM bucket_access
     )
   , bucket_rows AS (
       SELECT x.id
            , x.name
            , x.is_public
            , x.file_size_limit
            , x.allowed_mime_types_json
       FROM bucket_xml AS b
            CROSS JOIN LATERAL xmltable(('/table/row')
                                        PASSING b.data
                                        COLUMNS id text PATH 'id'
                                              , name text PATH 'name'
                                              , is_public text PATH 'public'
                                              , file_size_limit text PATH 'file_size_limit'
                                              , allowed_mime_types_json text PATH 'allowed_mime_types_json') AS x
     )
  SELECT pg_catalog.jsonb_build_object('snapshot_kind'
                                     , 'fitness_os_remote_metadata_v2'
                                     , 'completion_marker'
                                     , 'FITNESS_OS_REMOTE_AUDIT_V2_COMPLETE'
                                     , 'observed_at'
                                     , pg_catalog.clock_timestamp()
                                     , 'display_timezone'
                                     , 'Asia/Shanghai'
                                     , 'intended_project_ref_not_identity_proof'
                                     , 'lrehapbujedrwpxzhqrt'
                                     , 'identity'
                                     , pg_catalog.jsonb_build_object('database'
                                                                   , pg_catalog.current_database()
                                                                   , 'current_user'
                                                                   , CURRENT_USER
                                                                   , 'session_user'
                                                                   , SESSION_USER
                                                                   , 'server_version'
                                                                   , pg_catalog.current_setting('server_version')
                                                                   , 'transaction_read_only'
                                                                   , pg_catalog.current_setting('transaction_read_only')
                                                                   , 'statement_timeout'
                                                                   , pg_catalog.current_setting('statement_timeout')
                                                                   , 'lock_timeout'
                                                                   , pg_catalog.current_setting('lock_timeout')
                                                                   , 'server_version_full'
                                                                   , pg_catalog.version())
                                     , 'coverage'
                                     , pg_catalog.jsonb_build_object('application_rows_read', FALSE, 'auth_rows_read', FALSE, 'storage_object_rows_read', FALSE, 'private_filenames_read', FALSE, 'bucket_configuration_rows_only', TRUE, 'ledger_versions_names_only', TRUE, 'definition_text_policy', 'Function/view/trigger bodies never returned. Other expressions only returned if SHA256 matches reviewed local allowlist; otherwise null plus digest.', 'ledger_limit', 1000, 'bucket_limit', 500, 'null_is_not_empty_or_zero', TRUE)
                                     , 'schema_presence'
                                     , (SELECT jsonb_agg(jsonb_build_object('schema'
                                                                          , w.schema_name
                                                                          , 'present'
                                                                          , n.oid IS NOT NULL
                                                                          , 'owner'
                                                                          , pg_get_userbyid(n.nspowner)
                                                                          , 'acl'
                                                                          , CAST(n.nspacl AS text)) ORDER BY w.schema_name)
                                        FROM wanted_schemas AS w
                                             LEFT JOIN pg_namespace AS n ON n.nspname = w.schema_name)
                                     , 'all_non_system_schemas'
                                     , (SELECT jsonb_agg(jsonb_build_object('schema'
                                                                          , nspname
                                                                          , 'owner'
                                                                          , pg_get_userbyid(nspowner)
                                                                          , 'acl'
                                                                          , CAST(nspacl AS text)) ORDER BY nspname)
                                        FROM custom_schemas)
                                     , 'table_counts'
                                     , jsonb_build_object('expected_local_count'
                                                        , 20
                                                        , 'matching_expected_table_names'
                                                        , (SELECT count(*)
                                                           FROM expected_tables AS e
                                                                INNER JOIN relations AS r ON r.nspname = e.schema_name
                                                                                         AND r.relname = e.table_name
                                                                                         AND r.relkind IN ('r', 'p'))
                                                        , 'all_public_app_private_tables'
                                                        , (SELECT count(*)
                                                           FROM relations
                                                           WHERE nspname IN ('public', 'app_private')
                                                             AND relkind IN ('r', 'p'))
                                                        , 'count_scope_note'
                                                        , 'public/app_private can include unrelated tables; expected-name count does not prove definitions match')
                                     , 'expected_table_presence'
                                     , (SELECT jsonb_agg(jsonb_build_object('schema'
                                                                          , e.schema_name
                                                                          , 'name'
                                                                          , e.table_name
                                                                          , 'present'
                                                                          , r.oid IS NOT NULL
                                                                          , 'kind'
                                                                          , CAST(r.relkind AS text)) ORDER BY e.schema_name
                                                                                                            , e.table_name)
                                        FROM expected_tables AS e
                                             LEFT JOIN relations AS r ON r.nspname = e.schema_name
                                                                     AND r.relname = e.table_name)
                                     , 'expected_column_presence'
                                     , (SELECT jsonb_agg(jsonb_build_object('schema'
                                                                          , e.schema_name
                                                                          , 'table'
                                                                          , e.table_name
                                                                          , 'column'
                                                                          , e.column_name
                                                                          , 'expected_type'
                                                                          , e.expected_type
                                                                          , 'actual_type'
                                                                          , format_type(a.atttypid, a.atttypmod)
                                                                          , 'status'
                                                                          , CASE
                                                                              WHEN r.oid IS NULL
                                                                                THEN 'missing_relation'
                                                                              WHEN r.relkind NOT IN ('r', 'p')
                                                                                THEN 'wrong_relation_kind'
                                                                              WHEN a.attnum IS NULL
                                                                                THEN 'missing_column'
                                                                              WHEN format_type(a.atttypid, a.atttypmod) <> e.expected_type
                                                                                THEN 'type_mismatch'
                                                                              ELSE 'type_matches_only'
                                                                            END) ORDER BY e.schema_name
                                                                                        , e.table_name
                                                                                        , e.column_name)
                                        FROM expected_columns AS e
                                             LEFT JOIN relations AS r ON r.nspname = e.schema_name
                                                                     AND r.relname = e.table_name
                                             LEFT JOIN pg_attribute AS a ON a.attrelid = r.oid
                                                                        AND a.attname = e.column_name
                                                                        AND a.attnum > 0
                                                                        AND NOT a.attisdropped)
                                     , 'relations'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT nspname AS schema_name
                                                   , relname AS name
                                                   , CAST(relkind AS text) AS kind
                                                   , pg_get_userbyid(relowner) AS owner
                                                   , relrowsecurity AS rls
                                                   , relforcerowsecurity AS force_rls
                                                   , CAST(relacl AS text) AS acl
                                                   , (SELECT COALESCE(jsonb_agg(o)
                                                                    , '[]')
                                                      FROM unnest(reloptions) AS o
                                                      WHERE split_part(o, '=', 1) IN ('security_invoker', 'security_barrier')) AS view_security_options
                                              FROM relations) AS x)
                                     , 'columns'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.ordinal)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS table_name
                                                   , a.attnum AS ordinal
                                                   , a.attname AS name
                                                   , format_type(a.atttypid, a.atttypmod) AS data_type
                                                   , a.attnotnull AS not_null
                                                   , CAST(a.attidentity AS text) AS identity_kind
                                                   , CAST(a.attgenerated AS text) AS generated_kind
                                                   , CAST(a.attacl AS text) AS acl
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(d.adbin, d.adrelid) AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN pg_get_expr(d.adbin, d.adrelid)
                                                       ELSE NULL
                                                     END AS default_expression
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(d.adbin, d.adrelid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS default_expression_sha256
                                              FROM relations AS r
                                                   INNER JOIN pg_attribute AS a ON a.attrelid = r.oid
                                                                               AND a.attnum > 0
                                                                               AND NOT a.attisdropped
                                                   LEFT JOIN pg_attrdef AS d ON d.adrelid = a.attrelid
                                                                            AND d.adnum = a.attnum) AS x)
                                     , 'constraints'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS table_name
                                                   , c.conname AS name
                                                   , CAST(c.contype AS text) AS kind
                                                   , c.conkey AS local_column_ordinals
                                                   , c.confkey AS referenced_column_ordinals
                                                   , CAST(c.confupdtype AS text) AS on_update_code
                                                   , CAST(c.confdeltype AS text) AS on_delete_code
                                                   , CAST(c.confmatchtype AS text) AS match_type
                                                   , c.convalidated AS validated
                                                   , c.condeferrable AS "deferrable"
                                                   , c.condeferred AS initially_deferred
                                                   , CASE
                                                       WHEN c.confrelid = 0
                                                         THEN NULL
                                                       ELSE CAST(CAST(c.confrelid AS regclass) AS text)
                                                     END AS referenced_relation
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_constraintdef(c.oid, TRUE) AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN pg_get_constraintdef(c.oid, TRUE)
                                                       ELSE NULL
                                                     END AS definition
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_constraintdef(c.oid, TRUE) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS definition_sha256
                                              FROM pg_constraint AS c
                                                   INNER JOIN relations AS r ON r.oid = c.conrelid) AS x)
                                     , 'indexes'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS table_name
                                                   , ic.relname AS name
                                                   , CAST(i.indkey AS text) AS column_ordinals
                                                   , i.indnkeyatts AS key_column_count
                                                   , i.indnatts AS total_column_count
                                                   , i.indislive AS is_live
                                                   , i.indisunique AS is_unique
                                                   , i.indisprimary AS is_primary
                                                   , i.indisvalid AS is_valid
                                                   , i.indisready AS is_ready
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_indexdef(i.indexrelid) AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN pg_get_indexdef(i.indexrelid)
                                                       ELSE NULL
                                                     END AS definition
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_indexdef(i.indexrelid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS definition_sha256
                                              FROM pg_index AS i
                                                   INNER JOIN relations AS r ON r.oid = i.indrelid
                                                   INNER JOIN pg_class AS ic ON ic.oid = i.indexrelid) AS x)
                                     , 'views'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS name
                                                   , CAST(r.relkind AS text) AS kind
                                                   , CAST(NULL AS text) AS definition
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_viewdef(r.oid, TRUE) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS definition_sha256
                                              FROM relations AS r
                                              WHERE r.relkind IN ('v', 'm')) AS x)
                                     , 'enums'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.sort_order)
                                                      , '[]')
                                        FROM (SELECT n.nspname AS schema_name
                                                   , t.typname AS name
                                                   , e.enumsortorder AS sort_order
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(e.enumlabel AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN e.enumlabel
                                                       ELSE NULL
                                                     END AS label
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(e.enumlabel AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS label_sha256
                                              FROM pg_type AS t
                                                   INNER JOIN pg_namespace AS n ON n.oid = t.typnamespace
                                                   INNER JOIN pg_enum AS e ON e.enumtypid = t.oid
                                              WHERE n.oid IN (SELECT oid
                                                              FROM application_schemas)) AS x)
                                     , 'functions'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.identity_arguments)
                                                      , '[]')
                                        FROM (SELECT p.oid AS catalog_oid
                                                   , p.nspname AS schema_name
                                                   , p.proname AS name
                                                   , pg_get_function_identity_arguments(p.oid) AS identity_arguments
                                                   , pg_get_function_result(p.oid) AS result_type
                                                   , l.lanname AS language
                                                   , pg_get_userbyid(p.proowner) AS owner
                                                   , p.prosecdef AS security_definer
                                                   , CAST(p.provolatile AS text) AS volatility
                                                   , p.proleakproof AS leakproof
                                                   , p.pronargdefaults AS default_argument_count
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(p.proargdefaults, 0) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS default_arguments_sha256
                                                   , CAST(p.proacl AS text) AS acl
                                                   , (SELECT COALESCE(jsonb_agg(v ORDER BY v)
                                                                    , '[]')
                                                      FROM unnest(p.proconfig) AS v
                                                      WHERE v IN ('lock_timeout=3s', 'row_security=off', 'row_security=on', 'search_path=""', 'search_path=pg_catalog', 'search_path=pg_catalog, app_private', 'search_path=pg_catalog, app_private, public', 'search_path=pg_catalog, public', 'search_path=pg_catalog, public, app_private', 'statement_timeout=30s')) AS safe_settings
                                                   , (SELECT COALESCE(jsonb_agg(split_part(v, '=', 1) ORDER BY v)
                                                                    , '[]')
                                                      FROM unnest(p.proconfig) AS v
                                                      WHERE v NOT IN ('lock_timeout=3s', 'row_security=off', 'row_security=on', 'search_path=""', 'search_path=pg_catalog', 'search_path=pg_catalog, app_private', 'search_path=pg_catalog, app_private, public', 'search_path=pg_catalog, public', 'search_path=pg_catalog, public, app_private', 'statement_timeout=30s')) AS withheld_setting_names
                                                   , (SELECT COALESCE(jsonb_agg(jsonb_build_object('name'
                                                                                                 , split_part(v, '=', 1)
                                                                                                 , 'sha256'
                                                                                                 , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(v AS text)
                                                                                                                                                           , 'UTF8'))
                                                                                                                   , 'hex')) ORDER BY split_part(v, '=', 1))
                                                                    , '[]')
                                                      FROM unnest(p.proconfig) AS v
                                                      WHERE v NOT IN ('lock_timeout=3s', 'row_security=off', 'row_security=on', 'search_path=""', 'search_path=pg_catalog', 'search_path=pg_catalog, app_private', 'search_path=pg_catalog, app_private, public', 'search_path=pg_catalog, public', 'search_path=pg_catalog, public, app_private', 'statement_timeout=30s')) AS withheld_settings
                                                   , CAST(NULL AS text) AS definition
                                                   , CAST('withheld_source_by_default' AS text) AS definition_status
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_functiondef(p.oid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS definition_sha256
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(p.prosrc AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS source_sha256
                                              FROM functions AS p
                                                   INNER JOIN pg_language AS l ON l.oid = p.prolang) AS x)
                                     , 'expected_function_presence'
                                     , (SELECT jsonb_agg(jsonb_build_object('schema'
                                                                          , e.schema_name
                                                                          , 'name'
                                                                          , e.function_name
                                                                          , 'overloads'
                                                                          , (SELECT count(*)
                                                                             FROM functions AS p
                                                                             WHERE p.nspname = e.schema_name
                                                                               AND p.proname = e.function_name)) ORDER BY e.schema_name
                                                                                                                        , e.function_name)
                                        FROM expected_functions AS e)
                                     , 'triggers'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT t.nspname AS schema_name
                                                   , t.relname AS table_name
                                                   , t.tgname AS name
                                                   , CAST(t.tgenabled AS text) AS enabled
                                                   , CAST(t.tgtype AS integer) AS event_type_bits
                                                   , t.tgnargs AS argument_count
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(CAST(t.tgargs AS text) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS arguments_sha256
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(t.tgqual, t.tgrelid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS condition_sha256
                                                   , t.tgfoid AS function_oid
                                                   , fn.nspname AS function_schema
                                                   , p.proname AS function_name
                                                   , pg_get_function_identity_arguments(p.oid) AS function_arguments
                                                   , CAST(NULL AS text) AS definition
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_triggerdef(t.oid, TRUE) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS definition_sha256
                                              FROM triggers AS t
                                                   INNER JOIN pg_proc AS p ON p.oid = t.tgfoid
                                                   INNER JOIN pg_namespace AS fn ON fn.oid = p.pronamespace) AS x)
                                     , 'possible_duplicate_triggers'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(d))
                                                      , '[]')
                                        FROM (SELECT nspname AS schema_name
                                                   , relname AS table_name
                                                   , tgfoid AS function_oid
                                                   , CAST(tgtype AS integer) AS event_type_bits
                                                   , count(*) AS trigger_count
                                                   , array_agg(tgname ORDER BY tgname) AS trigger_names
                                              FROM triggers
                                              GROUP BY nspname, relname, tgfoid, tgtype
                                              HAVING count(*) > 1) AS d)
                                     , 'policies'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS table_name
                                                   , p.polname AS name
                                                   , p.polpermissive AS permissive
                                                   , CAST(p.polcmd AS text) AS command
                                                   , (SELECT COALESCE(jsonb_agg(CASE
                                                                                  WHEN u.role_oid = 0
                                                                                    THEN 'PUBLIC'
                                                                                  ELSE pg_get_userbyid(u.role_oid)
                                                                                END ORDER BY u.role_oid)
                                                                    , '[]')
                                                      FROM unnest(p.polroles) AS u (role_oid)) AS roles
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(p.polqual, p.polrelid) AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN pg_get_expr(p.polqual, p.polrelid)
                                                       ELSE NULL
                                                     END AS using_expression
                                                   , CASE
                                                       WHEN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(p.polwithcheck, p.polrelid) AS text)
                                                                                                                    , 'UTF8'))
                                                                            , 'hex') IN (SELECT sha256
                                                                                         FROM reviewed_expression_hashes)
                                                         THEN pg_get_expr(p.polwithcheck, p.polrelid)
                                                       ELSE NULL
                                                     END AS with_check_expression
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(p.polqual, p.polrelid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS using_sha256
                                                   , pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(CAST(pg_get_expr(p.polwithcheck, p.polrelid) AS text)
                                                                                                             , 'UTF8'))
                                                                     , 'hex') AS with_check_sha256
                                              FROM pg_policy AS p
                                                   INNER JOIN relations AS r ON r.oid = p.polrelid) AS x)
                                     , 'resolved_relation_acl'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.grantee
                                                                                     , x.privilege)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS name
                                                   , CASE
                                                       WHEN a.grantee = 0
                                                         THEN 'PUBLIC'
                                                       ELSE pg_get_userbyid(a.grantee)
                                                     END AS grantee
                                                   , pg_get_userbyid(a.grantor) AS grantor
                                                   , a.privilege_type AS privilege
                                                   , a.is_grantable
                                              FROM relations AS r
                                                   CROSS JOIN LATERAL aclexplode(COALESCE(r.relacl
                                                                                        , acldefault(CASE
                                                                                                       WHEN r.relkind = 'S'
                                                                                                         THEN CAST('S' AS "char")
                                                                                                       ELSE CAST('r' AS "char")
                                                                                                     END
                                                                                                   , r.relowner))) AS a) AS x)
                                     , 'effective_table_privileges'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.role_name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS name
                                                   , a.rolname AS role_name
                                                   , has_table_privilege(a.oid, r.oid, 'SELECT') AS can_select
                                                   , has_table_privilege(a.oid, r.oid, 'INSERT') AS can_insert
                                                   , has_table_privilege(a.oid, r.oid, 'UPDATE') AS can_update
                                                   , has_table_privilege(a.oid, r.oid, 'DELETE') AS can_delete
                                                   , has_table_privilege(a.oid, r.oid, 'TRUNCATE') AS can_truncate
                                                   , has_table_privilege(a.oid, r.oid, 'REFERENCES') AS can_reference
                                                   , has_table_privilege(a.oid, r.oid, 'TRIGGER') AS can_trigger
                                              FROM relations AS r
                                                   CROSS JOIN api_roles AS a
                                              WHERE r.relkind IN ('r', 'p', 'v', 'm', 'f')) AS x)
                                     , 'effective_column_privileges'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.table_name
                                                                                     , x.column_name
                                                                                     , x.role_name)
                                                      , '[]')
                                        FROM (SELECT r.nspname AS schema_name
                                                   , r.relname AS table_name
                                                   , c.attname AS column_name
                                                   , a.rolname AS role_name
                                                   , has_column_privilege(a.oid, r.oid, c.attnum, 'SELECT') AS can_select
                                                   , has_column_privilege(a.oid, r.oid, c.attnum, 'INSERT') AS can_insert
                                                   , has_column_privilege(a.oid, r.oid, c.attnum, 'UPDATE') AS can_update
                                                   , has_column_privilege(a.oid, r.oid, c.attnum, 'REFERENCES') AS can_reference
                                              FROM relations AS r
                                                   INNER JOIN pg_attribute AS c ON c.attrelid = r.oid
                                                                               AND c.attnum > 0
                                                                               AND NOT c.attisdropped
                                                   CROSS JOIN api_roles AS a
                                              WHERE r.relkind IN ('r', 'p', 'v', 'm', 'f')) AS x)
                                     , 'resolved_function_acl'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.grantee
                                                                                     , x.privilege)
                                                      , '[]')
                                        FROM (SELECT p.nspname AS schema_name
                                                   , p.proname AS name
                                                   , pg_get_function_identity_arguments(p.oid) AS arguments
                                                   , CASE
                                                       WHEN a.grantee = 0
                                                         THEN 'PUBLIC'
                                                       ELSE pg_get_userbyid(a.grantee)
                                                     END AS grantee
                                                   , a.privilege_type AS privilege
                                                   , a.is_grantable
                                              FROM functions AS p
                                                   CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl
                                                                                        , acldefault('f', p.proowner))) AS a) AS x)
                                     , 'effective_function_privileges'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.name
                                                                                     , x.arguments
                                                                                     , x.role_name)
                                                      , '[]')
                                        FROM (SELECT p.nspname AS schema_name
                                                   , p.proname AS name
                                                   , pg_get_function_identity_arguments(p.oid) AS arguments
                                                   , a.rolname AS role_name
                                                   , has_function_privilege(a.oid, p.oid, 'EXECUTE') AS can_execute
                                              FROM functions AS p
                                                   CROSS JOIN api_roles AS a) AS x)
                                     , 'resolved_schema_acl'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.grantee
                                                                                     , x.privilege)
                                                      , '[]')
                                        FROM (SELECT n.nspname AS schema_name
                                                   , CASE
                                                       WHEN a.grantee = 0
                                                         THEN 'PUBLIC'
                                                       ELSE pg_get_userbyid(a.grantee)
                                                     END AS grantee
                                                   , a.privilege_type AS privilege
                                                   , a.is_grantable
                                              FROM custom_schemas AS n
                                                   CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl
                                                                                        , acldefault('n', n.nspowner))) AS a) AS x)
                                     , 'effective_schema_privileges'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.schema_name
                                                                                     , x.role_name)
                                                      , '[]')
                                        FROM (SELECT n.nspname AS schema_name
                                                   , r.rolname AS role_name
                                                   , has_schema_privilege(r.oid, n.oid, 'USAGE') AS can_use
                                                   , has_schema_privilege(r.oid, n.oid, 'CREATE') AS can_create
                                              FROM custom_schemas AS n
                                                   CROSS JOIN api_roles AS r) AS x)
                                     , 'default_acl'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.owner
                                                                                     , x.schema_name
                                                                                     , x.object_type
                                                                                     , x.grantee
                                                                                     , x.privilege)
                                                      , '[]')
                                        FROM (SELECT pg_get_userbyid(d.defaclrole) AS owner
                                                   , n.nspname AS schema_name
                                                   , CAST(d.defaclobjtype AS text) AS object_type
                                                   , CASE
                                                       WHEN a.grantee = 0
                                                         THEN 'PUBLIC'
                                                       ELSE pg_get_userbyid(a.grantee)
                                                     END AS grantee
                                                   , a.privilege_type AS privilege
                                                   , a.is_grantable
                                                   , CAST(d.defaclacl AS text) AS raw_acl
                                              FROM pg_default_acl AS d
                                                   LEFT JOIN pg_namespace AS n ON n.oid = d.defaclnamespace
                                                   CROSS JOIN LATERAL aclexplode(d.defaclacl) AS a) AS x)
                                     , 'builtin_default_acl_templates'
                                     , (SELECT COALESCE(jsonb_agg(jsonb_build_object('owner'
                                                                                   , r.rolname
                                                                                   , 'object_type'
                                                                                   , CAST(t.kind AS text)
                                                                                   , 'builtin_acl'
                                                                                   , CAST(acldefault(t.kind, r.oid) AS text)) ORDER BY r.rolname
                                                                                                                                     , t.kind)
                                                      , '[]')
                                        FROM pg_roles AS r
                                             CROSS JOIN ((VALUES (CAST('r' AS "char"))
                                                               , (CAST('f' AS "char"))
                                                               , (CAST('S' AS "char"))
                                                               , (CAST('n' AS "char")))) AS t (kind)
                                        WHERE r.rolname IN ('postgres', 'supabase_admin')
                                           OR r.rolname = CURRENT_USER)
                                     , 'effective_sequence_privileges'
                                     , (SELECT COALESCE(jsonb_agg(jsonb_build_object('schema'
                                                                                   , r.nspname
                                                                                   , 'name'
                                                                                   , r.relname
                                                                                   , 'role'
                                                                                   , a.rolname
                                                                                   , 'can_use'
                                                                                   , has_sequence_privilege(a.oid, r.oid, 'USAGE')
                                                                                   , 'can_read'
                                                                                   , has_sequence_privilege(a.oid, r.oid, 'SELECT')
                                                                                   , 'can_change'
                                                                                   , has_sequence_privilege(a.oid, r.oid, 'UPDATE')) ORDER BY r.nspname
                                                                                                                                            , r.relname
                                                                                                                                            , a.rolname)
                                                      , '[]')
                                        FROM relations AS r
                                             CROSS JOIN api_roles AS a
                                        WHERE r.relkind = 'S')
                                     , 'roles'
                                     , (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.name)
                                                      , '[]')
                                        FROM (SELECT rolname AS name
                                                   , rolsuper AS superuser
                                                   , rolinherit AS inherit
                                                   , rolcreaterole AS create_role
                                                   , rolcreatedb AS create_db
                                                   , rolcanlogin AS can_login
                                                   , rolreplication AS replication
                                                   , rolbypassrls AS bypass_rls
                                                   , rolconnlimit AS connection_limit
                                              FROM pg_roles) AS x)
                                     , 'role_memberships'
                                     , jsonb_build_object('status'
                                                        , CASE
                                                            WHEN (SELECT can_read
                                                                  FROM member_access)
                                                              THEN 'available'
                                                            ELSE 'insufficient_privilege'
                                                          END
                                                        , 'rows'
                                                        , CASE
                                                            WHEN (SELECT can_read
                                                                  FROM member_access)
                                                              THEN (SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.granted_role
                                                                                                                 , m.member_role)
                                                                                  , '[]')
                                                                    FROM member_rows AS m)
                                                            ELSE NULL
                                                          END)
                                     , 'storage_buckets'
                                     , jsonb_build_object('table_present'
                                                        , EXISTS (SELECT 1
                                                                  FROM bucket_access)
                                                        , 'can_read'
                                                        , (SELECT can_read AND columns_present
                                                           FROM bucket_access)
                                                        , 'status'
                                                        , CASE
                                                            WHEN NOT EXISTS (SELECT 1
                                                                             FROM bucket_access)
                                                              THEN 'unavailable'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM bucket_access
                                                                         WHERE NOT can_read)
                                                              THEN 'insufficient_privilege'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM bucket_access
                                                                         WHERE NOT columns_present
                                                                            OR relkind NOT IN ('r', 'p'))
                                                              THEN 'unsupported_structure'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM bucket_access
                                                                         WHERE NOT no_rls_policy_evaluation)
                                                              THEN 'unavailable_rls_active'
                                                            ELSE 'available'
                                                          END
                                                        , 'rows'
                                                        , CASE
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM bucket_access
                                                                         WHERE can_read
                                                                           AND columns_present
                                                                           AND no_rls_policy_evaluation
                                                                           AND relkind IN ('r', 'p'))
                                                              THEN (SELECT COALESCE(jsonb_agg(jsonb_build_object('id'
                                                                                                               , id
                                                                                                               , 'name'
                                                                                                               , name
                                                                                                               , 'public'
                                                                                                               , CAST(is_public AS boolean)
                                                                                                               , 'file_size_limit'
                                                                                                               , CAST(file_size_limit AS bigint)
                                                                                                               , 'allowed_mime_types'
                                                                                                               , CAST(allowed_mime_types_json AS jsonb)) ORDER BY id)
                                                                                  , '[]')
                                                                    FROM (SELECT *
                                                                          FROM bucket_rows
                                                                          ORDER BY id
                                                                          LIMIT 500) AS visible_buckets)
                                                            ELSE NULL
                                                          END
                                                        , 'truncated'
                                                        , (SELECT count(*) >= 500
                                                           FROM bucket_rows)
                                                        , 'has_more_confirmed'
                                                        , (SELECT count(*) > 500
                                                           FROM bucket_rows)
                                                        , 'record_limit'
                                                        , 500)
                                     , 'migration_history'
                                     , jsonb_build_object('relation_present'
                                                        , EXISTS (SELECT 1
                                                                  FROM ledger)
                                                        , 'catalog'
                                                        , (SELECT to_jsonb(l)
                                                           FROM ledger AS l)
                                                        , 'status'
                                                        , CASE
                                                            WHEN NOT EXISTS (SELECT 1
                                                                             FROM ledger)
                                                              THEN 'unavailable'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM ledger
                                                                         WHERE NOT can_read)
                                                              THEN 'insufficient_privilege'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM ledger
                                                                         WHERE relkind NOT IN ('r', 'p')
                                                                            OR NOT version_text_column)
                                                              THEN 'unsupported_structure'
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM ledger
                                                                         WHERE relrowsecurity)
                                                              THEN 'unavailable_rls_active'
                                                            ELSE 'available'
                                                          END
                                                        , 'rows'
                                                        , CASE
                                                            WHEN EXISTS (SELECT 1
                                                                         FROM ledger
                                                                         WHERE relkind IN ('r', 'p')
                                                                           AND can_read
                                                                           AND version_text_column
                                                                           AND NOT relrowsecurity)
                                                              THEN (SELECT COALESCE(jsonb_agg(jsonb_build_object('version', version, 'name', name) ORDER BY version)
                                                                                  , '[]')
                                                                    FROM (SELECT *
                                                                          FROM ledger_rows
                                                                          ORDER BY version
                                                                          LIMIT 1000) AS visible_ledger)
                                                            ELSE NULL
                                                          END
                                                        , 'truncated'
                                                        , (SELECT count(*) >= 1000
                                                           FROM ledger_rows)
                                                        , 'has_more_confirmed'
                                                        , (SELECT count(*) > 1000
                                                           FROM ledger_rows)
                                                        , 'record_limit'
                                                        , 1000
                                                        , 'duplicate_versions_in_returned_rows'
                                                        , (SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.version)
                                                                         , '[]')
                                                           FROM (SELECT version
                                                                      , count(*) AS occurrences
                                                                 FROM (SELECT *
                                                                       FROM ledger_rows
                                                                       ORDER BY version
                                                                       LIMIT 1000) AS lim
                                                                 GROUP BY version
                                                                 HAVING count(*) > 1) AS d)
                                                        , 'noncanonical_versions_in_returned_rows'
                                                        , (SELECT COALESCE(jsonb_agg(version)
                                                                         , '[]')
                                                           FROM (SELECT *
                                                                 FROM ledger_rows
                                                                 ORDER BY version
                                                                 LIMIT 1000) AS lim
                                                           WHERE version !~ '^[0-9]{14}$')
                                                        , 'chronological_apply_order_verifiable'
                                                        , FALSE
                                                        , 'missing_versions_verifiable'
                                                        , FALSE
                                                        , 'statement_bodies_exported'
                                                        , FALSE
                                                        , 'order_note'
                                                        , 'version sorting is not execution chronology; no applied_at or immutable file digest was read'
                                                        , 'file_hash_proof'
                                                        , 'version/name only does not establish deployed SQL bytes or missing intermediate versions')
                                     , 'audit_completeness'
                                     , jsonb_build_object('truncated'
                                                        , (SELECT count(*) >= 1000
                                                           FROM ledger_rows)
                                                       OR (SELECT count(*) >= 500
                                                           FROM bucket_rows)
                                                        , 'optional_sources_available'
                                                        , EXISTS (SELECT 1
                                                                  FROM ledger
                                                                  WHERE can_read
                                                                    AND version_text_column
                                                                    AND NOT relrowsecurity
                                                                    AND relkind IN ('r', 'p'))
                                                      AND EXISTS (SELECT 1
                                                                  FROM bucket_access
                                                                  WHERE can_read
                                                                    AND columns_present
                                                                    AND no_rls_policy_evaluation
                                                                    AND relkind IN ('r', 'p'))
                                                      AND (SELECT can_read
                                                           FROM member_access)
                                                        , 'function_code_review'
                                                        , 'not_performed; compare digests and request separately protected review if required'
                                                        , 'rls_runtime_isolation'
                                                        , 'not_tested_by_catalog_audit')
                                     , 'other_possible_ledgers'
                                     , (SELECT COALESCE(jsonb_agg(jsonb_build_object('schema'
                                                                                   , n.nspname
                                                                                   , 'name'
                                                                                   , c.relname
                                                                                   , 'kind'
                                                                                   , CAST(c.relkind AS text)
                                                                                   , 'rows_read'
                                                                                   , FALSE) ORDER BY n.nspname
                                                                                                   , c.relname)
                                                      , '[]')
                                        FROM pg_class AS c
                                             INNER JOIN pg_namespace AS n ON n.oid = c.relnamespace
                                        WHERE n.oid IN (SELECT oid
                                                        FROM custom_schemas)
                                          AND c.relkind IN ('r', 'p', 'v')
                                          AND (c.relname ~* '(migration|schema_version|flyway|databasechangelog)'
                                            OR c.relname = '_prisma_migrations')
                                          AND c.oid IS DISTINCT FROM (SELECT oc.oid
                                                                      FROM pg_catalog.pg_class AS oc
                                                                           INNER JOIN pg_catalog.pg_namespace AS ons ON ons.oid = oc.relnamespace
                                                                      WHERE ons.nspname = 'supabase_migrations'
                                                                        AND oc.relname = 'schema_migrations'))) AS remote_metadata_snapshot;

-- FITNESS_OS_REMOTE_AUDIT_V2_END
ROLLBACK;
