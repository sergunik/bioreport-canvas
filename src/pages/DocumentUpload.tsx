import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout, PageContainer } from '@/components/layout';
import DocumentUploadCard from '@/components/DocumentUploadCard';

export default function DocumentUpload() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t('documents.upload.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('documents.upload.subtitle')}
          </p>
        </div>

        <DocumentUploadCard onSuccess={() => navigate('/documents', { replace: true })} />
      </PageContainer>
    </MainLayout>
  );
}
