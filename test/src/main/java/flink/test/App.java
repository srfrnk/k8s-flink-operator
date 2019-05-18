/*
 * This Java source file was generated by the Gradle 'init' task.
 */
package flink.test;

import java.util.Arrays;
import org.apache.beam.runners.flink.FlinkPipelineOptions;
import org.apache.beam.runners.flink.FlinkRunner;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Count;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.apache.flink.api.java.utils.ParameterTool;
import org.slf4j.LoggerFactory;

public class App {
    private static org.slf4j.Logger LOG = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        ParameterTool parameters = ParameterTool.fromArgs(args);
        String jobName = parameters.get("jobName", "Undefined-Name");
        String prop1 = parameters.get("envKey1", "-------");
        String prop2 = parameters.get("envKey2", "-------");
        LOG.info("prop1:"+prop1);
        LOG.info("prop2:"+prop2);
        FlinkPipelineOptions pipelineOptions =
                PipelineOptionsFactory.create().as(FlinkPipelineOptions.class);
        pipelineOptions.setJobName(jobName);
        pipelineOptions.setRunner(FlinkRunner.class);
        pipelineOptions.setParallelism(1);
        pipelineOptions.setStreaming(false);
        Pipeline p = Pipeline.create(pipelineOptions);
        p.apply(Create.of(Arrays.asList("To be, or not to be: that is the question:",
                "Whether 'tis nobler in the mind to suffer", "The slings and arrows of fortune,",
                "Or to take arms against a sea of troubles,")))

                .setCoder(StringUtf8Coder.of())

                .apply(ParDo.of(new DoFn<String, String>() {
                    private static final long serialVersionUID = 1;

                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        String line = c.element();
                        for (int i = 0; i < 1000; i++) {
                            c.output(line);
                        }
                    }
                }))

                .apply(ParDo.of(new DoFn<String, String>() {
                    private static final long serialVersionUID = 1;

                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        String[] words = c.element().split("\\s");
                        for (String word : words) {
                            c.output(word);
                        }
                    }
                }))

                .apply(MapElements.into(TypeDescriptors.strings()).via(word -> {
                    try { Thread.sleep(1000); } catch (InterruptedException e) {}
                    return word;
                }))

                .apply(Count.perElement())

                .apply(MapElements.into(TypeDescriptors.strings()).via(kv -> {
                    LOG.info("{} : {}", kv.getKey(), kv.getValue());
                    return kv.getKey();
                }));

        p.run();
        LOG.info("Job should start running now...");
    }
}
