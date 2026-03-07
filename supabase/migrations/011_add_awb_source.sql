-- Add Attijariwafa Bank (AWB) as a PDF import source
ALTER TYPE import_source ADD VALUE IF NOT EXISTS 'pdf_awb';
