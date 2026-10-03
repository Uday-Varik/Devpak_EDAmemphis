-- Create project_details table to store section data as JSONB
CREATE TABLE public.project_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, section)
);

-- Enable Row Level Security
ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (via project ownership)
CREATE POLICY "Users can view their own project details"
ON public.project_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_details.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create details for their own projects"
ON public.project_details
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_details.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own project details"
ON public.project_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_details.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own project details"
ON public.project_details
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_details.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_details_updated_at
BEFORE UPDATE ON public.project_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();